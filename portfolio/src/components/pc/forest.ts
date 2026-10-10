import {registerPcTarget} from './runtime';
type Actor={species:string;animation:string;elapsed:number};
type Sprite={flying:boolean;animations:Record<string,{src:string}>};
export function connectForestResidents(actors:Actor[],sprites:Record<string,Sprite>,preload:(src:string)=>Promise<void>,wake:()=>void,changed:(index:number,species:string)=>void){
 const allowed=Object.keys(sprites).filter(id=>!sprites[id].flying&&['Walk','Idle','Sleep'].every(a=>sprites[id].animations[a]));
 const cleanups=actors.map((actor,index)=>{
  const original=actor.species;
  return registerPcTarget({id:'forest:'+index,label:'Forest place '+(index+1),group:'Transform Forest',original,allowed,current:()=>actor.species,
   prepare:async id=>{await Promise.all(['Idle','Walk','Sleep'].map(a=>preload(sprites[id].animations[a].src)));},
   apply:id=>{actor.species=id;actor.animation='Idle';actor.elapsed=0;changed(index,id);wake();}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
}
