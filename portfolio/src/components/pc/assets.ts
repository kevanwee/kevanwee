/** Metadata is shared; sheet decoding stays local to a selected resident. */
export type PcAnimation={src:string;w:number;h:number;rows:number;durations:number[];bounds:number[][]};
export type PcSprite={flying:boolean;animations:Record<string,PcAnimation>};
let pending:Promise<Record<string,PcSprite>>|undefined;
export function importedPcSprites(){
 return pending??=fetch('/pokemon-pc/resident-sprites.json').then(async response=>{
  if(!response.ok)throw Error('The PMD residents could not load.');
  return await response.json() as Record<string,PcSprite>;
 }).catch(error=>{pending=undefined;throw error;});
}
export async function loadPcSprites(sprites:Record<string,{flying:boolean;animations:Record<string,{src:string}>}>){
 for(const [id,sprite] of Object.entries(await importedPcSprites()))if(!sprites[id])sprites[id]=sprite;
 if(!sprites.ironvaliant&&sprites['iron-valiant'])sprites.ironvaliant=sprites['iron-valiant'];
}
/** Register native slots immediately, then refresh after metadata arrives. Never revive an unmounted scene. */
export function withPcAssets(load:()=>Promise<unknown>,connect:()=>()=>void){
 let disposed=false,cleanup=connect();
 void load().then(()=>{if(!disposed){cleanup();cleanup=connect();}}).catch(()=>{/* Native choices remain available; a remount retries. */});
 return ()=>{disposed=true;cleanup();};
}
