"use client";
import {useEffect,useRef,useState,useSyncExternalStore,type KeyboardEvent} from 'react';
import {capturePcDefaults,choosePcTarget,configurePc,pcRevision,pcSubscribe,pcTargets,resetPcDefaults,type CursorSnapshot,type PcTarget} from './runtime';
import './pc.css';
type Entry={id:string;dex:number;name:string;form:string;available?:boolean;preview?:{src:string;w:number;h:number;frames:number;bounds:number[]};icon:string;front:string;types:string[]};
type Catalog={version:number;entries:Entry[]};
export interface CursorHost {snapshot:CursorSnapshot;allowed:string[];max:number;forms:(id:string)=>{id:string;label:string}[];place:(index:number,id:string,form:string)=>void;restore:(state:CursorSnapshot)=>void}
/** One member of a box in the left bar: a cursor slot or a resident's place. */
type Member={id:string;species?:string};
type Group={key:string;label:string;members:Member[]};
const CURSOR='cursor:';
/** Every sprite in the PC is drawn at its natural size times an integer (CSS zoom), never fitted to a box. */
function Sprite({entry,large=false,mini=false,pmd=false}:{entry?:Entry;large?:boolean;mini?:boolean;pmd?:boolean}){
 if(!entry)return <span className="pc-empty-sprite" aria-hidden="true"/>;
 if(pmd&&entry.preview){
  const a=entry.preview,[l,t,r,b]=a.bounds,scale=Math.max(1,Math.min(2,Math.floor(64/Math.max(r-l,b-t))));
  return <span className="pc-native-sprite" style={{width:(r-l)*scale,height:(b-t)*scale,backgroundImage:`url(${a.src})`,backgroundSize:`${a.w*a.frames*scale}px auto`,backgroundPosition:`${-l*scale}px ${-t*scale}px`}}/>;
 }
 return <img className={large?'pc-front':mini?'pc-icon pc-mini':'pc-icon'} src={large?entry.front:entry.icon} alt="" loading="lazy" draggable={false} onError={e=>{e.currentTarget.hidden=true;}}/>;
}
export default function PokemonPc({namespace,title,cursor}:{namespace:string|null;title:string;cursor:CursorHost}){
 const [open,setOpen]=useState(false),[catalog,setCatalog]=useState<Catalog>(),[error,setError]=useState(''),[attempt,retry]=useState(0);
 const [box,setBox]=useState(0),[selected,setSelected]=useState('bulbasaur'),[team,setTeam]=useState(true),[target,setTarget]=useState(CURSOR+'0'),[expanded,setExpanded]=useState('cursor'),[menu,setMenu]=useState(false);
 const [query,setQuery]=useState(''),[filter,setFilter]=useState(false),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null),epoch=useRef(0),priorScope=useRef(namespace);
 const formMenu=useRef<HTMLDivElement>(null),selectionButton=useRef<HTMLButtonElement|null>(null),inFlight=useRef(false);
 const cursorRef=useRef(cursor);cursorRef.current=cursor;
 const revision=useSyncExternalStore(pcSubscribe,pcRevision,()=>0);void revision;
 const targets=pcTargets(),current=targets.find(t=>t.id===target),onCursor=target.startsWith(CURSOR);
 const allowed=onCursor?cursor.allowed:current?.allowed||[];
 useEffect(()=>{
  epoch.current++;configurePc(namespace);
  // Initial auth resolution can happen while browsing this public catalog.
  // Only an actual owner change closes the PC; edits still require a ready scope.
  if(priorScope.current!==null&&priorScope.current!==namespace){setOpen(false);setMenu(false);}
  else if(open&&namespace){try{capturePcDefaults(cursor.snapshot);}catch(e){setNote(e instanceof Error?e.message:'Defaults could not be saved.');}}
  priorScope.current=namespace;
  // Auth scope changes alone control this boundary; opening captures separately below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[namespace]);
 useEffect(()=>{if(menu)formMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();},[menu,selected]);
 useEffect(()=>{const show=()=>{opener.current=document.activeElement as HTMLElement;setOpen(true);setMenu(false);setNote('');setTarget(CURSOR+'0');setExpanded('cursor');setSelected(cursorRef.current.snapshot.lineup[0]||'bulbasaur');};window.addEventListener('pokemon-pc:open',show);return ()=>window.removeEventListener('pokemon-pc:open',show);},[]);
 useEffect(()=>{
  if(!open)return;
  const d=dialog.current!;d.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  try{if(namespace)capturePcDefaults(cursor.snapshot);}catch(e){setNote(e instanceof Error?e.message:'Defaults could not be saved.');}
  return ()=>{d.close();document.body.style.overflow=overflow;opener.current?.focus({preventScroll:true});};
  // Capture on opening, before any change. Do not reopen the dialog on cursor updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[open]);
 useEffect(()=>{
  if(!open||catalog)return;
  const controller=new AbortController();setError('');
  fetch('/pokemon-pc/catalog.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('The PC catalog could not load.');return r.json();}).then((data:Catalog)=>{if(data.version!==1||!Array.isArray(data.entries)||!data.entries.length)throw Error('The PC catalog is invalid.');setCatalog(data);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return ()=>controller.abort();
 },[open,catalog,attempt]);
 const all=catalog?.entries||[],species=all.filter(e=>e.form==='Normal'),chosen=all.find(e=>e.id===selected)||species[0];
 const byId=(id?:string)=>id?all.find(e=>e.id===id):undefined;
 const filtering=onCursor&&filter;
 const list=filtering?species.filter(e=>cursor.allowed.includes(e.id)):species,count=Math.max(1,Math.ceil(list.length/30)),page=Math.min(box,count-1),visible=list.slice(page*30,page*30+30);
 const forms=all.filter(e=>e.dex===chosen?.dex);
 // The left bar: the cursor lineup, then one box per Friend Area and the free-roaming residents, in the hosts' order.
 const groups:Group[]=[{key:'cursor',label:'Cursor companion',members:Array.from({length:cursor.max},(_,i)=>({id:CURSOR+i,species:cursor.snapshot.lineup[i]}))}];
 const grouped=new Map<string,PcTarget[]>();
 for(const t of [...targets].sort((a,b)=>(a.order??50)-(b.order??50)))grouped.set(t.group,[...(grouped.get(t.group)||[]),t]);
 for(const [label,members] of grouped)groups.push({key:'group:'+label,label,members:members.map(t=>({id:t.id,species:t.current()}))});
 const targetLabel=onCursor?`cursor slot ${Number(target.slice(CURSOR.length))+1}`:current?`${current.group} · ${byId(current.current())?.name||current.label}`:'a place';
 function changeBox(delta:number){setMenu(false);setBox((page+delta+count)%count);}
 function search(){setMenu(false);const q=query.trim().toLowerCase().replace(/^#/,'');const found=list.find(e=>String(e.dex)===q||e.name.toLowerCase()===q)||list.find(e=>e.name.toLowerCase().includes(q));if(found){setSelected(found.id);setBox(Math.floor(list.indexOf(found)/30));setNote('');}else setNote('No matching Pokémon in this view.');}
 function pick(member:Member){setMenu(false);setTarget(member.id);setBox(0);setNote('');if(member.species&&all.some(e=>e.id===member.species))setSelected(member.species);}
 function closeMenu(){setMenu(false);selectionButton.current?.focus({preventScroll:true});}
 async function choose(entry:Entry,form='normal'){
  if(!namespace||inFlight.current)return;
  inFlight.current=true;
  const ownEpoch=epoch.current;setBusy(true);setNote('');
  try{capturePcDefaults(cursor.snapshot);if(onCursor)cursor.place(Number(target.slice(CURSOR.length)),entry.id,form);else await choosePcTarget(target,entry.id);if(ownEpoch===epoch.current){setSelected(entry.id);setNote(`${entry.name} is ready.`);closeMenu();}}
  catch(e){if(ownEpoch===epoch.current)setNote(e instanceof Error?e.message:'That change could not be saved.');}
  finally{inFlight.current=false;setBusy(false);}
 }
 function restore(){try{cursor.restore(resetPcDefaults(cursor.snapshot));setNote('Your original Pokémon choices are restored.');}catch(e){setNote(e instanceof Error?e.message:'Defaults could not be restored.');}}
 function keys(e:KeyboardEvent<HTMLDivElement>){
  if(!(e.target instanceof HTMLElement)||!e.target.matches('[data-pc-slot]'))return;
  const i=visible.findIndex(s=>s.id===selected),moves:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-6,ArrowDown:6};
  if(e.key in moves){e.preventDefault();const n=Math.min(visible.length-1,Math.max(0,i+moves[e.key]));setSelected(visible[n].id);e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-pc-slot]')[n]?.focus();}
  if(e.key==='PageDown'||e.key==='PageUp'){e.preventDefault();changeBox(e.key==='PageDown'?1:-1);}
 }
 if(!open)return null;
 return <dialog ref={dialog} className="pokemon-pc-dialog" aria-label="Pokémon storage system" onCancel={e=>{e.preventDefault();if(menu)closeMenu();else setOpen(false);}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
  <section className="pokemon-pc-shell" data-lenis-prevent>
   <header className="pc-titlebar"><div><small>POKÉMON STORAGE SYSTEM</small><h2>{title}</h2></div><button onClick={()=>setOpen(false)} aria-label="Close Pokémon PC">Close ×</button></header>
   <form className="pc-searchbar" onSubmit={e=>{e.preventDefault();search();}}><input aria-label="Find a Pokémon" placeholder="Name or Pokédex number" value={query} onChange={e=>setQuery(e.target.value)}/><button>Find</button>{onCursor&&<label><input type="checkbox" checked={filter} onChange={e=>{setFilter(e.target.checked);setBox(0);}}/>Usable here</label>}</form>
   {!catalog?<div className="pc-loading" role="status">{error||'Opening the boxes…'}{error&&<button onClick={()=>retry(n=>n+1)}>Try again</button>}</div>:<div className="pc-columns">
    <aside className="pc-left" aria-label={team?'Your boxes':'Selected Pokémon'}>
     <button className="pc-team-toggle" aria-pressed={team} onClick={()=>setTeam(v=>!v)}>{team?'Pokémon summary':'Your boxes'}</button>
     {team?<div className="pc-groups">{groups.map(g=>{const isOpen=expanded===g.key,filled=g.members.filter(m=>m.species);return <section key={g.key} className="pc-group" data-open={isOpen||undefined}>
      <button className="pc-group-head" aria-expanded={isOpen} onClick={()=>setExpanded(isOpen?'':g.key)}>
       <span className="pc-group-name">{g.label}<small>{filled.length} Pokémon</small></span>
       {!isOpen&&<span className="pc-group-strip" aria-hidden="true">{filled.slice(0,6).map(m=><Sprite key={m.id} entry={byId(m.species)} mini/>)}</span>}
      </button>
      {isOpen&&<div className="pc-members" role="group" aria-label={g.label}>{g.members.map((m,i)=>{const entry=byId(m.species);return <button key={m.id} className="pc-member" aria-pressed={target===m.id} disabled={busy} onClick={()=>pick(m)} aria-label={`${g.label}, ${entry?.name||'empty slot '+(i+1)}`}>
       <span className="pc-member-sprite"><Sprite entry={entry}/></span><span className="pc-member-name">{entry?.name||'Empty'}</span></button>;})}</div>}
     </section>;})}</div>
     :<><div className="pc-selected-sprite"><Sprite entry={chosen} large/></div><h3>{chosen?.name}</h3><p>No. {String(chosen?.dex||0).padStart(3,'0')}</p><div className="pc-types">{chosen?.types?.map(type=><span key={type}>{type}</span>)}</div></>}
    </aside>
    <section className="pc-box" aria-label="Pokémon box">
     <nav className="pc-box-heading"><button type="button" aria-label="Previous box" onClick={()=>changeBox(-1)}>◀</button><strong>{filtering?'Available':String(visible[0]?.dex||0).padStart(3,'0')+'–'+String(visible.at(-1)?.dex||0).padStart(3,'0')}<small>BOX {page+1} / {count}</small></strong><button type="button" aria-label="Next box" onClick={()=>changeBox(1)}>▶</button></nav>
     <div className="pc-slots" role="group" aria-label="Box slots" onKeyDown={keys}>{visible.map(e=><button type="button" data-pc-slot={e.id} key={e.id} aria-label={`${e.name}, number ${e.dex}`} aria-pressed={e.id===chosen?.id} title={e.name} aria-haspopup="dialog" onClick={event=>{setSelected(e.id);selectionButton.current=event.currentTarget;setMenu(true);}}><Sprite entry={e}/>{onCursor&&allowed.includes(e.id)&&<span className="pc-ready-dot" aria-label="Usable here"/>}</button>)}{Array.from({length:30-visible.length},(_,i)=><span className="pc-empty-slot" key={'empty'+i}/>)}</div>
     <div className="pc-command"><div><strong>{chosen?.name}</strong><small>For {targetLabel}</small></div><span>Click a Pokémon to select its form.</span></div>
     {menu&&chosen&&<div className="pc-form-menu" ref={formMenu} role="dialog" aria-label={`Choose ${chosen.name} form`} aria-busy={busy}>
      <header><strong>{chosen.name} — select a form</strong><button aria-label="Close form menu" onClick={closeMenu}>×</button></header>
      <div className="pc-form-list">{onCursor?(cursor.allowed.includes(chosen.id)?cursor.forms(chosen.id).map(f=><button key={f.id} disabled={busy||!namespace} onClick={()=>void choose(chosen,f.id)}>{f.label}</button>):<p>This Pokémon is not a supported cursor. Use “Usable here” to see the custom cursor companions.</p>):forms.map(f=><button key={f.id} disabled={busy||!namespace||!allowed.includes(f.id)} onClick={()=>void choose(f)}><Sprite entry={f} pmd/><span>{f.form}{!allowed.includes(f.id)&&<small>{current?.reason||'PMD artwork unavailable'}</small>}</span></button>)}</div>
      {busy&&<p>Loading Pokémon…</p>}
     </div>}
    </section>
   </div>}
   <div className="pc-message" role="status">{note||'Your original team is saved. Changes stay in this browser.'}</div>
   <footer className="pc-footer"><button onClick={restore} disabled={!namespace||busy}>Restore defaults</button><a href="/pokemon-pc/defaults-v1.json" download>Original roster</a><details><summary>Credits</summary><p>Unofficial, non-commercial Pokémon fan project. Unaffiliated with Nintendo or The Pokémon Company. Pokémon artwork belongs to its respective owners. Box icons: <a href="https://github.com/smogon/sprites">Smogon / Pokémon Showdown sprite repository</a> (Gen 6/7 menu sprites; Generation VIII and IX icons by the Smogon community). Front sprites: <a href="https://github.com/PokeAPI/sprites">PokeAPI sprites</a> (later generations by the Smogon Sprite Project). Map residents: <a href="https://github.com/PMDCollab/SpriteCollab">PMD SpriteCollab contributors</a> (<a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>; original game artwork retains its owners’ rights; <a href="/pokemon-pc/sprite-credits.json">individual credits</a>). PC cabinet and box styling are original. Font: Pixelify Sans (SIL OFL). Forest: Toastypk, via Pamtre Berry. <a href="/pokemon-pc/receipts.json">Box asset sources</a>; <a href="/pokemon-pc/resident-forms.json">PMD form contributors</a>; <a href="/pokemon-pc/resident-receipts.json">PMD sources and hashes</a>.</p></details></footer>
  </section>
 </dialog>;
}
