/** Browser-only host boundary. No agent events, account tokens or filesystem imports. */
export interface PcTarget {
 id:string; label:string; group:string; original:string; allowed:string[];
 current:()=>string; apply:(id:string)=>void; prepare?:(id:string)=>Promise<void>;
 reason?:string;
}
export interface CursorSnapshot {lineup:string[];selected:string;mega:string[];fusion:string|null}
type Backup={version:1;cursor:CursorSnapshot;residents:Record<string,string>};
const targets=new Map<string,PcTarget>(),listeners=new Set<()=>void>();
const registrations=new Map<string,PcTarget[]>();
const edits=new Map<string,number>();
let revision=0,key='',choices:Record<string,string>={},generation=0;
const notify=()=>{revision++;for(const listener of listeners)listener();};
export const pcSubscribe=(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};};
export const pcRevision=()=>revision;
export const pcTargets=()=>[...targets.values()];
export const openPc=()=>window.dispatchEvent(new Event('pokemon-pc:open'));
const record=(value:unknown):value is Record<string,string>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).length<=512&&Object.entries(value).every(([k,v])=>k.length<160&&typeof v==='string'&&/^[a-z0-9-]{1,80}$/.test(v));
export function configurePc(namespace:string|null){
 if(key===(namespace||''))return;
 key=namespace||'';generation++;choices={};edits.clear();
 try{const data=key?JSON.parse(localStorage.getItem(key+'.choices')||'null'):null;if(data?.version===1&&record(data.residents))choices=data.residents;}catch{/* No valid saved overrides. */}
 for(const group of registrations.values())for(const target of group)target.apply(target.original);
 for(const group of registrations.values())for(const target of group)void restoreChoice(target);
 notify();
}
async function restoreChoice(target:PcTarget){
 const id=choices[target.id],epoch=generation,edit=edits.get(target.id);
 if(!id||!target.allowed.includes(id))return;
 try{await target.prepare?.(id);if(epoch===generation&&edit===edits.get(target.id)&&registrations.get(target.id)?.includes(target))target.apply(id);}catch{/* Keep original when sheets cannot load. */}
 notify();
}
export function registerPcTarget(target:PcTarget){
 const group=registrations.get(target.id)||[];group.push(target);registrations.set(target.id,group);
 targets.set(target.id,target);if(key)void restoreChoice(target);notify();
 return ()=>{const remaining=(registrations.get(target.id)||[]).filter(t=>t!==target);if(remaining.length){registrations.set(target.id,remaining);targets.set(target.id,remaining.at(-1)!);}else{registrations.delete(target.id);targets.delete(target.id);}notify();};
}
export function capturePcDefaults(cursor:CursorSnapshot):Backup{
 if(!key)throw Error('Your Pokémon preferences are still loading.');
 const saved=localStorage.getItem(key+'.defaults');
 if(saved){
  const value=JSON.parse(saved) as Backup;
  if(value?.version!==1||!record(value.residents)||!value.cursor||!Array.isArray(value.cursor.lineup)||!Array.isArray(value.cursor.mega)||typeof value.cursor.selected!=='string'||!(value.cursor.fusion===null||typeof value.cursor.fusion==='string'))throw Error('The saved defaults are unreadable. They have been preserved.');
  return value;
 }
 const backup:Backup={version:1,cursor:structuredClone(cursor),residents:Object.fromEntries(pcTargets().map(t=>[t.id,t.original]))};
 // Failure blocks the first edit: the original choices must be saved first.
 localStorage.setItem(key+'.defaults',JSON.stringify(backup));return backup;
}
export async function choosePcTarget(targetId:string,species:string){
 const target=targets.get(targetId),epoch=generation;
 if(!key||!target||!target.allowed.includes(species))throw Error('This Pokémon cannot take that place.');
 const edit=(edits.get(targetId)||0)+1;edits.set(targetId,edit);
 const group=[...(registrations.get(targetId)||[])];
 await Promise.all(group.map(t=>t.prepare?.(species)));
 if(generation!==epoch||edits.get(targetId)!==edit||targets.get(targetId)!==target)throw Error('That teammate is no longer available.');
 const next={...choices,[targetId]:species};
 localStorage.setItem(key+'.choices',JSON.stringify({version:1,residents:next}));
 choices=next;for(const t of group)if(registrations.get(targetId)?.includes(t))t.apply(species);notify();
}
export function resetPcDefaults(cursor:CursorSnapshot){
 const backup=capturePcDefaults(cursor);
 localStorage.removeItem(key+'.choices');choices={};generation++;
 for(const group of registrations.values())for(const target of group)target.apply(target.original);
 notify();return backup.cursor;
}
