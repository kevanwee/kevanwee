"use client";
import {useEffect} from 'react';
import PokemonPc from './pc/PokemonPc';
import {declareForestSlots} from './pc/forest';
import {usePokemonCursor,MEGA_CAPABLE,type PokemonId,type FusionId} from './PokemonCursorContext';
import {ALL_CURSORS,LINEUP_MAX,cleanLineup} from './cursorRoster';
import {EEVEELUTIONS} from '@/lib/pokemon-overworld';
import {SPRITES} from '@/lib/overworld-sprites';
export default function PokemonPcHost(){
 const cursor=usePokemonCursor();
 // The forest's box stays listed while another Friend Area is on screen.
 useEffect(()=>declareForestSlots(EEVEELUTIONS,SPRITES),[]);
 return <PokemonPc namespace={'portfolio.pokemon-pc'} title="Kevanwee’s PC" cursor={{
  snapshot:{lineup:cursor.lineup,selected:cursor.selectedPokemon,mega:cursor.megaForms,fusion:cursor.fusion},allowed:ALL_CURSORS,max:LINEUP_MAX,
  forms:id=>[{id:'normal',label:'Normal'},...(MEGA_CAPABLE.includes(id as PokemonId)?[{id:'mega',label:'Mega'}]:[]),...(id==='ceruledge'?['armarouge','darkrai','zygarde'].map(id=>({id,label:'Soul Unison: '+id})):[])],
  place:(index,id,form)=>{
   if(!ALL_CURSORS.includes(id as PokemonId))return;
   const lineup=[...cursor.lineup],from=lineup.indexOf(id as PokemonId);
   // A Pokémon already in the lineup swaps places rather than appearing twice.
   if(from>=0){if(index<lineup.length)[lineup[from],lineup[index]]=[lineup[index],lineup[from]];}
   else if(index<lineup.length)lineup[index]=id as PokemonId;else lineup.push(id as PokemonId);
   cursor.setLineup(lineup);cursor.setSelectedPokemon(id as PokemonId);
   if(MEGA_CAPABLE.includes(id as PokemonId))cursor.setMega(form==='mega',id as PokemonId);
   if(id==='ceruledge')cursor.setFusion(form==='normal'?null:form as FusionId);
  },
  restore:state=>{const lineup=cleanLineup(state.lineup);cursor.setLineup(lineup);cursor.setSelectedPokemon(lineup.includes(state.selected as PokemonId)?state.selected as PokemonId:lineup[0]);for(const id of MEGA_CAPABLE)cursor.setMega(state.mega.includes(id),id);cursor.setFusion(['armarouge','darkrai','zygarde'].includes(state.fusion||'')?state.fusion as FusionId:null);}
 }}/>
}
