"use client";
import type {CSSProperties} from 'react';
import {openPc} from './runtime';
/** Original pixel cabinet; a real keyboard/touch target on the map. */
export default function MapPc({style}:{style?:CSSProperties}){
 return <button type="button" className="pokemon-map-pc" style={style} aria-label="Open Pokémon PC" aria-haspopup="dialog" title="Pokémon PC" onClick={event=>{event.stopPropagation();openPc();}}>
  <svg viewBox="0 0 24 40" role="presentation" aria-hidden="true" shapeRendering="crispEdges">
   <path fill="#5c5565" d="M6 0h12v2h3v3h2v33H1V5h2V2h3z"/>
   <path fill="#b8b0bd" d="M4 3h16v3H4zM2 7h20v29H2z"/><path fill="#efe8db" d="M3 7h18v20H3z"/>
   <path fill="#817985" d="M4 12h16v13H4z"/><path fill="#4c593f" d="M6 14h12v9H6z"/>
   <path fill="#a5b663" d="M7 15h10v7H7z"/><path fill="#dce5aa" d="M8 16h4v2H8zM8 19h7v1H8z"/>
   <path fill="#ffffff" d="M4 8h16v2H4zM4 27h16v3H4z"/>
   <path fill="#817985" d="M5 27h1v3H5zM8 27h1v3H8zM11 27h1v3h-1zM14 27h1v3h-1zM17 27h1v3h-1z"/>
   <path fill="#6a6870" d="M4 32h16v4H4z"/><path fill="#acb3a0" d="M6 33h8v2H6z"/><path fill="#cbdb7f" d="M17 33h2v2h-2z"/>
   <path fill="#414440" d="M3 38h18v2H3z"/>
  </svg><span>PC</span>
 </button>;
}
