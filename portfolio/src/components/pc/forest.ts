import {loadPcSprites,withPcAssets} from './assets';
import {declarePcSlot,registerPcTarget} from './runtime';
type Actor={species:string;animation:string;elapsed:number};
type Sprite={flying:boolean;animations:Record<string,{src:string}>};
const GROUP='Transform Forest',ORDER=10;
const usable=(sprites:Record<string,Sprite>)=>Object.keys(sprites).filter(id=>['Walk','Idle','Sleep'].every(a=>sprites[id].animations[a]));
export function connectForestResidents(actors:Actor[],sprites:Record<string,Sprite>,preload:(src:string)=>Promise<void>,wake:()=>void,changed:(index:number,species:string)=>void){
 const originals=actors.map(actor=>actor.species);
 return withPcAssets(()=>loadPcSprites(sprites),()=>{
 const allowed=usable(sprites);
 const cleanups=actors.map((actor,index)=>{
  const original=originals[index];
  return registerPcTarget({id:'forest:'+index,label:'Place '+(index+1),group:GROUP,order:ORDER,original,allowed,current:()=>actor.species,
   prepare:async id=>{await Promise.all(['Idle','Walk','Sleep'].map(a=>preload(sprites[id].animations[a].src)));},
   apply:id=>{actor.species=id;actor.animation='Idle';actor.elapsed=0;changed(index,id);wake();}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
 });
}
/** Keep the forest's box listed while another Friend Area is on screen. */
export function declareForestSlots(originals:readonly string[],sprites:Record<string,Sprite>){
 return withPcAssets(()=>loadPcSprites(sprites),()=>{
 const allowed=usable(sprites);
 const cleanups=originals.map((original,index)=>declarePcSlot({id:'forest:'+index,label:'Place '+(index+1),group:GROUP,order:ORDER,original,allowed}));
 return ()=>cleanups.forEach(cleanup=>cleanup());
 });
}
