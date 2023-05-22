// Initialize and add the map
let map;

async function initMap() {
  const position = { lat: 1.3382973619377485, lng: 103.85678716931092 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    zoom: 4,
    center: position,
    mapId: "DEMO_MAP_ID",
  });

  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Conceptual Maths Modelling Tuition Centre",
  });
}

initMap();
