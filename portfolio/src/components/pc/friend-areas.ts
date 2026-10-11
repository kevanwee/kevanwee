import {importedPcSprites,withPcAssets} from './assets';
import {declarePcSlot,registerPcTarget} from './runtime';
type Area={id:string;name:string;roster:number[]};
type Sprites=Record<string,{pcId?:string;name:string;animations:Record<string,{src:string}>}>;
const slug=(name:string)=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/** Species with Friend Area sheets, by PC id. Any of them can take a native's place; guests keep their per-visit draw. */
function usable(sprites:Sprites){
 const dex=new Map<string,number>();
 for(const [number,sprite] of Object.entries(sprites))if(sprite.animations.Idle&&sprite.animations.Walk)dex.set(sprite.pcId??slug(sprite.name),Number(number));
 return dex;
}

async function importSprites(sprites:Sprites){
 const imported=await importedPcSprites();
 const native=new Set(Object.values(sprites).filter(s=>!s.pcId).map(s=>slug(s.name)));
 Object.entries(imported).forEach(([raw,sprite],index)=>{
  const id=raw==='iron-valiant'?'ironvaliant':raw;
  if(native.has(id))return;
  sprites[-index-1]={pcId:id,name:id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' '),animations:Object.fromEntries(Object.entries(sprite.animations).map(([action,a])=>[action,{
   ...a,durations:a.durations.map(d=>d*16*60/1000),origins:a.bounds.map(b=>[a.w/2,b[3]])
  }]))};
 });
}

const slot=(area:Area,index:number,order:number,sprites:Sprites,allowed:string[])=>({id:`area:${area.id}:${index}`,label:'Place '+(index+1),group:area.name,order:20+order,original:slug(sprites[area.roster[index]].name),allowed});
/** One PC box per Friend Area, listing its natives, without creating any residents (no extra work or random draws). */
export function declareFriendAreas(catalog:{areas:Area[];sprites:Sprites}){
 return withPcAssets(()=>importSprites(catalog.sprites),()=>{
 const allowed=[...usable(catalog.sprites).keys()];
 const cleanups=catalog.areas.flatMap((area,order)=>area.roster.map((_,index)=>declarePcSlot(slot(area,index,order,catalog.sprites,allowed))));
 return ()=>cleanups.forEach(cleanup=>cleanup());
 });
}
/** The area on screen: its natives (the first residents) change in place. `load` fetches a sheet into the scene. */
export function connectFriendArea(area:Area,order:number,catalog:{sprites:Sprites},actors:{id:number}[],load:(src:string)=>Promise<void>,changed:()=>void){
 return withPcAssets(()=>importSprites(catalog.sprites),()=>{
 const dex=usable(catalog.sprites),allowed=[...dex.keys()];
 const cleanups=area.roster.map((_,index)=>{
  const actor=actors[index];
  return registerPcTarget({...slot(area,index,order,catalog.sprites,allowed),current:()=>catalog.sprites[actor.id]?.pcId??slug(catalog.sprites[actor.id]?.name||''),
   prepare:async id=>{const s=catalog.sprites[dex.get(id)!];await Promise.all(['Idle','Walk'].map(a=>load(s.animations[a].src)));},
   apply:id=>{const next=dex.get(id);if(next!==undefined&&actor.id!==next){actor.id=next;changed();}}});
 });
 return ()=>cleanups.forEach(cleanup=>cleanup());
 });
}
