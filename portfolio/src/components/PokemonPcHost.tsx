"use client";
import PokemonPc from './pc/PokemonPc';
import {usePokemonCursor,MEGA_CAPABLE,type PokemonId,type FusionId} from './PokemonCursorContext';
import {ALL_CURSORS,cleanLineup} from './cursorRoster';
export default function PokemonPcHost(){
 const cursor=usePokemonCursor();
 return <PokemonPc namespace={'portfolio.pokemon-pc'} cursor={{
  snapshot:{lineup:cursor.lineup,selected:cursor.selectedPokemon,mega:cursor.megaForms,fusion:cursor.fusion},allowed:ALL_CURSORS,
  choose:id=>{
   if(!ALL_CURSORS.includes(id as PokemonId))return;
   if(!cursor.lineup.includes(id as PokemonId)){
    const lineup=[...cursor.lineup];if(lineup.length<6)lineup.push(id as PokemonId);else lineup[Math.max(0,lineup.indexOf(cursor.selectedPokemon))]=id as PokemonId;
    cursor.setLineup(lineup);
   }
   cursor.setSelectedPokemon(id as PokemonId);
  },
  restore:state=>{const lineup=cleanLineup(state.lineup);cursor.setLineup(lineup);cursor.setSelectedPokemon(lineup.includes(state.selected as PokemonId)?state.selected as PokemonId:lineup[0]);for(const id of MEGA_CAPABLE)cursor.setMega(state.mega.includes(id),id);cursor.setFusion(['armarouge','darkrai','zygarde'].includes(state.fusion||'')?state.fusion as FusionId:null);}
 }}/>
}
