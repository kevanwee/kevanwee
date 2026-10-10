import {registerPcTarget} from './runtime';
type Sprite={flying:boolean;animations:Record<string,{src:string}>};
type Actor={id:string;species:string;surface:string;flying:boolean;leader:string|null;animation:string;elapsed:number};
/** Swap only the artwork-compatible resident, preserving its identity, position and visit. */
export function connectPageResidents(actors:Actor[],sprites:Record<string,Sprite>,preload:(src:string)=>Promise<void>,wake:()=>void,changed:(id:string,species:string)=>void){
 const cleanups=actors.map(actor=>{
  const original=actor.species;
  const special=['armarouge','ceruledge','appletun','mega-greninja'].includes(original)||actor.surface==='search'||!!actor.leader||actors.some(a=>a.leader===actor.id);
  const allowed=special?[original]:Object.keys(sprites).filter(id=>!['armarouge','ceruledge'].includes(id)&&sprites[id].flying===actor.flying&&['Walk','Idle','Sleep'].every(a=>sprites[id].animations[a]));
  return registerPcTarget({id:'resident:'+actor.id,label:original.split('-').join(' '),group:'Page resident',original,allowed,current:()=>actor.species,
   reason:special?'This resident keeps its paired or special role. You can change the independent residents.':undefined,
   prepare:async id=>{await Promise.all(['Idle','Walk','Sleep'].map(a=>preload(sprites[id].animations[a].src)));},
   apply:id=>{actor.species=id;actor.animation='Idle';actor.elapsed=0;changed(actor.id,id);wake();}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
}
