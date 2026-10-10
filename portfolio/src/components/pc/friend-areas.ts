import {declarePcSlot,registerPcTarget} from './runtime';
type Area={id:string;name:string;roster:number[]};
type Sprites=Record<string,{name:string;animations:Record<string,{src:string}>}>;
const slug=(name:string)=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/** Species with Friend Area sheets, by PC id. Any of them can take a native's place; guests keep their per-visit draw. */
function usable(sprites:Sprites){
 const dex=new Map<string,number>();
 for(const [number,sprite] of Object.entries(sprites))if(sprite.animations.Idle&&sprite.animations.Walk)dex.set(slug(sprite.name),Number(number));
 return dex;
}
const slot=(area:Area,index:number,order:number,sprites:Sprites,allowed:string[])=>({id:`area:${area.id}:${index}`,label:'Place '+(index+1),group:area.name,order:20+order,original:slug(sprites[area.roster[index]].name),allowed});
/** One PC box per Friend Area, listing its natives, without creating any residents (no extra work or random draws). */
export function declareFriendAreas(catalog:{areas:Area[];sprites:Sprites}){
 const allowed=[...usable(catalog.sprites).keys()];
 const cleanups=catalog.areas.flatMap((area,order)=>area.roster.map((_,index)=>declarePcSlot(slot(area,index,order,catalog.sprites,allowed))));
 return ()=>cleanups.forEach(cleanup=>cleanup());
}
/** The area on screen: its natives (the first residents) change in place. `load` fetches a sheet into the scene. */
export function connectFriendArea(area:Area,order:number,catalog:{sprites:Sprites},actors:{id:number}[],load:(src:string)=>Promise<void>,changed:()=>void){
 const dex=usable(catalog.sprites),allowed=[...dex.keys()];
 const cleanups=area.roster.map((_,index)=>{
  const actor=actors[index];
  return registerPcTarget({...slot(area,index,order,catalog.sprites,allowed),current:()=>slug(catalog.sprites[actor.id]?.name||''),
   prepare:async id=>{const s=catalog.sprites[dex.get(id)!];await Promise.all(['Idle','Walk'].map(a=>load(s.animations[a].src)));},
   apply:id=>{const next=dex.get(id);if(next&&actor.id!==next){actor.id=next;changed();}}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
}
