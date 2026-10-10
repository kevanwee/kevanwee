"use client";
import {useEffect,useRef,useState,useSyncExternalStore,type KeyboardEvent} from 'react';
import {capturePcDefaults,choosePcTarget,configurePc,pcRevision,pcSubscribe,pcTargets,resetPcDefaults,type CursorSnapshot} from './runtime';
import './pc.css';
type Entry={id:string;dex:number;name:string;form:string;icon:string;front:string;types:string[];preview?:{src:string;w:number;h:number;frames:number;bounds:number[]}};
type Catalog={version:number;entries:Entry[]};
export interface CursorHost {snapshot:CursorSnapshot;allowed:string[];choose:(id:string)=>void;restore:(state:CursorSnapshot)=>void}
function Sprite({entry,large=false}:{entry?:Entry;large?:boolean}){
 if(!entry)return <span className="pc-empty-sprite">?</span>;
 if(entry.preview&&entry.form!=='Normal'){
  const a=entry.preview,[l,t,r,b]=a.bounds,scale=Math.min(large?3:2,(large?112:46)/Math.max(r-l,b-t));
  return <span className="pc-native-sprite" style={{width:(r-l)*scale,height:(b-t)*scale,backgroundImage:`url(${a.src})`,backgroundSize:`${a.w*a.frames*scale}px auto`,backgroundPosition:`${-l*scale}px ${-t*scale}px`}}/>;
 }
 return <img className={large?'pc-front':'pc-icon'} src={large?entry.front:entry.icon} alt="" loading="lazy" onError={e=>{e.currentTarget.hidden=true;}}/>;
}
export default function PokemonPc({namespace,cursor}:{namespace:string|null;cursor:CursorHost}){
 const [open,setOpen]=useState(false),[catalog,setCatalog]=useState<Catalog>(),[error,setError]=useState(''),[attempt,retry]=useState(0);
 const [box,setBox]=useState(0),[selected,setSelected]=useState('bulbasaur'),[team,setTeam]=useState(true),[target,setTarget]=useState('cursor');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState(false),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null),epoch=useRef(0);
 const revision=useSyncExternalStore(pcSubscribe,pcRevision,()=>0);void revision;
 const targets=pcTargets(),current=targets.find(t=>t.id===target),allowed=target==='cursor'?cursor.allowed:current?.allowed||[];
 useEffect(()=>{epoch.current++;configurePc(namespace);setOpen(false);},[namespace]);
 useEffect(()=>{const show=()=>{opener.current=document.activeElement as HTMLElement;setOpen(true);setNote('');};window.addEventListener('pokemon-pc:open',show);return ()=>window.removeEventListener('pokemon-pc:open',show);},[]);
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
 const list=filter?all.filter(e=>allowed.includes(e.id)):species,count=Math.max(1,Math.ceil(list.length/30)),page=Math.min(box,count-1),visible=list.slice(page*30,page*30+30);
 const forms=all.filter(e=>e.dex===chosen?.dex);
 function changeBox(delta:number){setBox((page+delta+count)%count);}
 function search(){const q=query.trim().toLowerCase().replace(/^#/,'');const found=list.find(e=>String(e.dex)===q||e.name.toLowerCase()===q)||list.find(e=>e.name.toLowerCase().includes(q));if(found){setSelected(found.id);setBox(Math.floor(list.indexOf(found)/30));setNote('');}else setNote('No matching Pokémon in this view.');}
 async function choose(){
  if(!chosen||!namespace||busy)return;
  const ownEpoch=epoch.current;setBusy(true);setNote('');
  try{capturePcDefaults(cursor.snapshot);if(target==='cursor')cursor.choose(chosen.id);else await choosePcTarget(target,chosen.id);if(ownEpoch===epoch.current)setNote(`${chosen.name} is ready.`);}
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
   <header className="pc-titlebar"><div><small>POKÉMON STORAGE SYSTEM</small><h2>{namespace?.startsWith('voracity')?'Voracity':'Kevanwee'}’s PC</h2></div><button onClick={()=>setOpen(false)} aria-label="Close Pokémon PC">Close ×</button></header>
   <form className="pc-searchbar" onSubmit={e=>{e.preventDefault();search();}}><input aria-label="Find a Pokémon" placeholder="Name or Pokédex number" value={query} onChange={e=>setQuery(e.target.value)}/><button>Find</button><label><input type="checkbox" checked={filter} onChange={e=>{setFilter(e.target.checked);setBox(0);}}/>Usable here</label></form>
   {!catalog?<div className="pc-loading" role="status">{error||'Opening the boxes…'}{error&&<button onClick={()=>retry(n=>n+1)}>Try again</button>}</div>:<div className="pc-columns">
    <aside className="pc-left" aria-label={team?'Your team':'Selected Pokémon'}>
     <button className="pc-team-toggle" aria-pressed={team} onClick={()=>setTeam(v=>!v)}>{team?'Pokémon summary':'Build team'}</button>
     {team?<><h3>Your team</h3><p>Pick a place, then a Pokémon from the box.</p><div className="pc-team-list"><button aria-pressed={target==='cursor'} onClick={()=>{setTarget('cursor');setBox(0);}}><Sprite entry={all.find(e=>e.id===cursor.snapshot.selected)}/><span>Cursor companion<small>{cursor.snapshot.lineup.length} in your lineup</small></span></button>{targets.map(t=><button key={t.id} aria-pressed={target===t.id} onClick={()=>{setTarget(t.id);setBox(0);}}><Sprite entry={all.find(e=>e.id===t.current())}/><span>{t.label}<small>{t.group}</small></span></button>)}</div></>:<><div className="pc-selected-sprite"><Sprite entry={chosen} large/></div><h3>{chosen?.name}</h3><p>No. {String(chosen?.dex||0).padStart(3,'0')}</p><div className="pc-types">{chosen?.types?.map(type=><span key={type}>{type}</span>)}</div><p>{chosen?.preview&&chosen.form!=='Normal'?'Native PMD sprite':'Pokédex preview'}</p></>}
    </aside>
    <section className="pc-box" aria-label="Pokémon box">
     <nav className="pc-box-heading"><button type="button" aria-label="Previous box" onClick={()=>changeBox(-1)}>◀</button><strong>{filter?'Available':String(visible[0]?.dex||0).padStart(3,'0')+'–'+String(visible.at(-1)?.dex||0).padStart(3,'0')}<small>BOX {page+1} / {count}</small></strong><button type="button" aria-label="Next box" onClick={()=>changeBox(1)}>▶</button></nav>
     <div className="pc-slots" role="group" aria-label="Box slots" onKeyDown={keys}>{visible.map(e=><button type="button" data-pc-slot={e.id} key={e.id} aria-label={`${e.name}, number ${e.dex}`} aria-pressed={e.id===chosen?.id} title={e.name} onClick={()=>setSelected(e.id)}><Sprite entry={e}/>{allowed.includes(e.id)&&<span className="pc-ready-dot" aria-label="Usable here"/>}</button>)}{Array.from({length:30-visible.length},(_,i)=><span className="pc-empty-slot" key={'empty'+i}/>)}</div>
     <div className="pc-command"><div><strong>{chosen?.name}</strong><small>For {target==='cursor'?'your cursor':current?.label||'a teammate'}</small></div>{forms.length>1&&<select aria-label="Pokémon form" value={chosen?.id} onChange={e=>setSelected(e.target.value)}>{forms.map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select>}<button disabled={busy||!namespace||!chosen||!allowed.includes(chosen.id)} onClick={()=>void choose()}>{busy?'Loading…':target==='cursor'?'Use cursor':'Choose'}</button></div>
     {!allowed.includes(chosen?.id||'')&&<p className="pc-hint">{current?.reason||'This Pokémon has no compatible animation set for this place yet. Try “Usable here”.'}</p>}
    </section>
   </div>}
   <div className="pc-message" role="status">{note||'Your original team is saved. Changes stay in this browser.'}</div>
   <footer className="pc-footer"><button onClick={restore} disabled={!namespace||busy}>Restore defaults</button><a href="/pokemon-pc/defaults-v1.json" download>Original roster</a><details><summary>Credits</summary><p>Unofficial, non-commercial Pokémon fan project. Unaffiliated with Nintendo or The Pokémon Company. Pokémon artwork belongs to its respective owners. PMD sprites: <a href="https://github.com/PMDCollab/SpriteCollab">SpriteCollab contributors</a> (<a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>; original game artwork retains its owners’ rights). Box icons/fronts: <a href="https://github.com/PokeAPI/sprites">PokeAPI sprites</a>. PC cabinet and box styling are original. Font: Pixelify Sans (SIL OFL). Forest: Toastypk, via Pamtre Berry. <a href="/pokemon-pc/sprite-credits.json">Individual sprite contributor credits</a>; existing PMD sheets are cropped and some forms are recoloured or combined. <a href="/pokemon-pc/receipts.json">Asset sources and hashes</a>.</p></details></footer>
  </section>
 </dialog>;
}
