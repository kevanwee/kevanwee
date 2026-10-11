import {loadPcSprites,withPcAssets} from './assets';
import {registerPcTarget} from './runtime';
type Sprite={flying:boolean;animations:Record<string,{src:string}>};
type Actor={roleSpecies?:string;id:string;species:string;surface:string;flying:boolean;leader:string|null;animation:string;elapsed:number};
/** Fixed mascots, the search bar's pair and bonded pairs keep their roles, so only independent residents are listed. */
const FIXED=['armarouge','ceruledge','appletun','mega-greninja'];
/** Swap only the artwork-compatible resident, preserving its identity, position and visit. */
export function connectPageResidents(actors:Actor[],sprites:Record<string,Sprite>,preload:(src:string)=>Promise<void>,wake:()=>void,changed:(id:string,species:string)=>void){
 return withPcAssets(()=>loadPcSprites(sprites),()=>{
 const cleanups=actors.filter(actor=>!(FIXED.includes(actor.roleSpecies??actor.species)||actor.surface==='search'||!!actor.leader||actors.some(a=>a.leader===actor.id))).map(actor=>{
  const original=actor.roleSpecies??actor.species;actor.roleSpecies=original;
  const allowed=Object.keys(sprites).filter(id=>['Walk','Idle','Sleep'].every(a=>sprites[id].animations[a]));
  return registerPcTarget({id:'resident:'+actor.id,label:original.split('-').join(' '),group:'Free roaming',order:100,original,allowed,current:()=>actor.species,
   prepare:async id=>{await Promise.all(['Idle','Walk','Sleep'].map(a=>preload(sprites[id].animations[a].src)));},
   apply:id=>{actor.species=id;actor.animation='Idle';actor.elapsed=0;changed(actor.id,id);wake();}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
 });
}
