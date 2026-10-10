"use client";
import {useEffect,useRef,useState,useSyncExternalStore,type KeyboardEvent} from 'react';
import {capturePcDefaults,choosePcTarget,configurePc,pcRevision,pcSubscribe,pcTargets,resetPcDefaults,type CursorSnapshot,type PcTarget} from './runtime';
import './pc.css';
type Entry={id:string;dex:number;name:string;form:string;icon:string;front:string;types:string[]};
type Catalog={version:number;entries:Entry[]};
export interface CursorHost {snapshot:CursorSnapshot;allowed:string[];max:number;place:(index:number,id:string)=>void;restore:(state:CursorSnapshot)=>void}
/** One member of a box in the left bar: a cursor slot or a resident's place. */
type Member={id:string;species?:string};
type Group={key:string;label:string;members:Member[]};
const CURSOR='cursor:';
/** Every sprite in the PC is drawn at its natural size times an integer (CSS zoom), never fitted to a box. */
function Sprite({entry,large=false,mini=false}:{entry?:Entry;large?:boolean;mini?:boolean}){
 if(!entry)return <span className="pc-empty-sprite" aria-hidden="true"/>;
 return <img className={large?'pc-front':mini?'pc-icon pc-mini':'pc-icon'} src={large?entry.front:entry.icon} alt="" loading="lazy" draggable={false} onError={e=>{e.currentTarget.hidden=true;}}/>;
}
export default function PokemonPc({namespace,title,cursor}:{namespace:string|null;title:string;cursor:CursorHost}){
 const [open,setOpen]=useState(false),[catalog,setCatalog]=useState<Catalog>(),[error,setError]=useState(''),[attempt,retry]=useState(0);
 const [box,setBox]=useState(0),[selected,setSelected]=useState('bulbasaur'),[team,setTeam]=useState(true),[target,setTarget]=useState(CURSOR+'0'),[expanded,setExpanded]=useState('cursor');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState(false),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null),epoch=useRef(0);
 const cursorRef=useRef(cursor);cursorRef.current=cursor;
 const revision=useSyncExternalStore(pcSubscribe,pcRevision,()=>0);void revision;
 const targets=pcTargets(),current=targets.find(t=>t.id===target),onCursor=target.startsWith(CURSOR);
 const allowed=onCursor?cursor.allowed:current?.allowed||[];
 useEffect(()=>{epoch.current++;configurePc(namespace);setOpen(false);},[namespace]);
 useEffect(()=>{const show=()=>{opener.current=document.activeElement as HTMLElement;setOpen(true);setNote('');setTarget(CURSOR+'0');setExpanded('cursor');setSelected(cursorRef.current.snapshot.lineup[0]||'bulbasaur');};window.addEventListener('pokemon-pc:open',show);return ()=>window.removeEventListener('pokemon-pc:open',show);},[]);
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
 const list=filter?all.filter(e=>allowed.includes(e.id)):species,count=Math.max(1,Math.ceil(list.length/30)),page=Math.min(box,count-1),visible=list.slice(page*30,page*30+30);
 const forms=all.filter(e=>e.dex===chosen?.dex);
 // The left bar: the cursor lineup, then one box per Friend Area and the free-roaming residents, in the hosts' order.
 const groups:Group[]=[{key:'cursor',label:'Cursor companion',members:Array.from({length:cursor.max},(_,i)=>({id:CURSOR+i,species:cursor.snapshot.lineup[i]}))}];
 const grouped=new Map<string,PcTarget[]>();
 for(const t of [...targets].sort((a,b)=>(a.order??50)-(b.order??50)))grouped.set(t.group,[...(grouped.get(t.group)||[]),t]);
 for(const [label,members] of grouped)groups.push({key:'group:'+label,label,members:members.map(t=>({id:t.id,species:t.current()}))});
 const targetLabel=onCursor?`cursor slot ${Number(target.slice(CURSOR.length))+1}`:current?`${current.group} · ${byId(current.current())?.name||current.label}`:'a place';
 function changeBox(delta:number){setBox((page+delta+count)%count);}
 function search(){const q=query.trim().toLowerCase().replace(/^#/,'');const found=list.find(e=>String(e.dex)===q||e.name.toLowerCase()===q)||list.find(e=>e.name.toLowerCase().includes(q));if(found){setSelected(found.id);setBox(Math.floor(list.indexOf(found)/30));setNote('');}else setNote('No matching Pokémon in this view.');}
 function pick(member:Member){setTarget(member.id);setBox(0);setNote('');if(member.species&&all.some(e=>e.id===member.species))setSelected(member.species);}
 async function choose(){
  if(!chosen||!namespace||busy)return;
  const ownEpoch=epoch.current;setBusy(true);setNote('');
  try{capturePcDefaults(cursor.snapshot);if(onCursor)cursor.place(Number(target.slice(CURSOR.length)),chosen.id);else await choosePcTarget(target,chosen.id);if(ownEpoch===epoch.current)setNote(`${chosen.name} is ready.`);}
  catch(e){if(ownEpoch===epoch.current)setNote(e instanceof Error?e.message:'That change could not be saved.');}
  finally{setBusy(false);}
 }
 function restore(){try{cursor.restore(resetPcDefaults(cursor.snapshot));setNote('Your original Pokémon choices are restored.');}catch(e){setNote(e instanceof Error?e.message:'Defaults could not be restored.');}}
 function keys(e:KeyboardEvent<HTMLDivElement>){
  if(!(e.target instanceof HTMLElement)||!e.target.matches('[data-pc-slot]'))return;
  const i=visible.findIndex(s=>s.id===selected),moves:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-6,ArrowDown:6};
  if(e.key in moves){e.preventDefault();const n=Math.min(visible.length-1,Math.max(0,i+moves[e.key]));setSelected(visible[n].id);e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-pc-slot]')[n]?.focus();}
  if(e.key==='PageDown'||e.key==='PageUp'){e.preventDefault();changeBox(e.key==='PageDown'?1:-1);}
 }
 if(!open)return null;
 return <dialog ref={dialog} className="pokemon-pc-dialog" aria-label="Pokémon storage system" onCancel={e=>{e.preventDefault();setOpen(false);}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
  <section className="pokemon-pc-shell" data-lenis-prevent>
   <header className="pc-titlebar"><div><small>POKÉMON STORAGE SYSTEM</small><h2>{title}</h2></div><button onClick={()=>setOpen(false)} aria-label="Close Pokémon PC">Close ×</button></header>
   <form className="pc-searchbar" onSubmit={e=>{e.preventDefault();search();}}><input aria-label="Find a Pokémon" placeholder="Name or Pokédex number" value={query} onChange={e=>setQuery(e.target.value)}/><button>Find</button><label><input type="checkbox" checked={filter} onChange={e=>{setFilter(e.target.checked);setBox(0);}}/>Usable here</label></form>
   {!catalog?<div className="pc-loading" role="status">{error||'Opening the boxes…'}{error&&<button onClick={()=>retry(n=>n+1)}>Try again</button>}</div>:<div className="pc-columns">
    <aside className="pc-left" aria-label={team?'Your boxes':'Selected Pokémon'}>
     <button className="pc-team-toggle" aria-pressed={team} onClick={()=>setTeam(v=>!v)}>{team?'Pokémon summary':'Your boxes'}</button>
     {team?<div className="pc-groups">{groups.map(g=>{const isOpen=expanded===g.key,filled=g.members.filter(m=>m.species);return <section key={g.key} className="pc-group" data-open={isOpen||undefined}>
      <button className="pc-group-head" aria-expanded={isOpen} onClick={()=>setExpanded(isOpen?'':g.key)}>
       <span className="pc-group-name">{g.label}<small>{filled.length} Pokémon</small></span>
       {!isOpen&&<span className="pc-group-strip" aria-hidden="true">{filled.slice(0,6).map(m=><Sprite key={m.id} entry={byId(m.species)} mini/>)}</span>}
      </button>
      {isOpen&&<div className="pc-members" role="group" aria-label={g.label}>{g.members.map((m,i)=>{const entry=byId(m.species);return <button key={m.id} className="pc-member" aria-pressed={target===m.id} onClick={()=>pick(m)} aria-label={`${g.label}, ${entry?.name||'empty slot '+(i+1)}`}>
       <span className="pc-member-sprite"><Sprite entry={entry}/></span><span className="pc-member-name">{entry?.name||'Empty'}</span></button>;})}</div>}
     </section>;})}</div>
     :<><div className="pc-selected-sprite"><Sprite entry={chosen} large/></div><h3>{chosen?.name}</h3><p>No. {String(chosen?.dex||0).padStart(3,'0')}</p><div className="pc-types">{chosen?.types?.map(type=><span key={type}>{type}</span>)}</div></>}
    </aside>
    <section className="pc-box" aria-label="Pokémon box">
     <nav className="pc-box-heading"><button type="button" aria-label="Previous box" onClick={()=>changeBox(-1)}>◀</button><strong>{filter?'Available':String(visible[0]?.dex||0).padStart(3,'0')+'–'+String(visible.at(-1)?.dex||0).padStart(3,'0')}<small>BOX {page+1} / {count}</small></strong><button type="button" aria-label="Next box" onClick={()=>changeBox(1)}>▶</button></nav>
     <div className="pc-slots" role="group" aria-label="Box slots" onKeyDown={keys}>{visible.map(e=><button type="button" data-pc-slot={e.id} key={e.id} aria-label={`${e.name}, number ${e.dex}`} aria-pressed={e.id===chosen?.id} title={e.name} onClick={()=>setSelected(e.id)}><Sprite entry={e}/>{allowed.includes(e.id)&&<span className="pc-ready-dot" aria-label="Usable here"/>}</button>)}{Array.from({length:30-visible.length},(_,i)=><span className="pc-empty-slot" key={'empty'+i}/>)}</div>
     <div className="pc-command"><div><strong>{chosen?.name}</strong><small>For {targetLabel}</small></div>{forms.length>1&&<select aria-label="Pokémon form" value={chosen?.id} onChange={e=>setSelected(e.target.value)}>{forms.map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select>}<button disabled={busy||!namespace||!chosen||!allowed.includes(chosen.id)} onClick={()=>void choose()}>{busy?'Loading…':onCursor?'Use cursor':'Choose'}</button></div>
     {!allowed.includes(chosen?.id||'')&&<p className="pc-hint">{current?.reason||'This Pokémon has no compatible animation set for this place yet. Try “Usable here”.'}</p>}
    </section>
   </div>}
   <div className="pc-message" role="status">{note||'Your original team is saved. Changes stay in this browser.'}</div>
   <footer className="pc-footer"><button onClick={restore} disabled={!namespace||busy}>Restore defaults</button><a href="/pokemon-pc/defaults-v1.json" download>Original roster</a><details><summary>Credits</summary><p>Unofficial, non-commercial Pokémon fan project. Unaffiliated with Nintendo or The Pokémon Company. Pokémon artwork belongs to its respective owners. Box icons: <a href="https://github.com/smogon/sprites">Smogon / Pokémon Showdown sprite repository</a> (Gen 6/7 menu sprites; Generation VIII and IX icons by the Smogon community). Front sprites: <a href="https://github.com/PokeAPI/sprites">PokeAPI sprites</a> (later generations by the Smogon Sprite Project). Map residents: <a href="https://github.com/PMDCollab/SpriteCollab">PMD SpriteCollab contributors</a> (<a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>; original game artwork retains its owners’ rights; <a href="/pokemon-pc/sprite-credits.json">individual credits</a>). PC cabinet and box styling are original. Font: Pixelify Sans (SIL OFL). Forest: Toastypk, via Pamtre Berry. <a href="/pokemon-pc/receipts.json">Asset sources and hashes</a>.</p></details></footer>
  </section>
 </dialog>;
}
