export default function MauvilleBanner() {
  return (
    <div className="mt-12">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
        Currently roaming · Mauville City
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border border-cream-200 bg-white"
        style={{ height: "120px" }}
      >
        {/* Fade left & right */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

        {/* Two copies side-by-side for seamless loop */}
        <div className="route-marquee-x flex" style={{ height: "120px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pokemon-roam-mauville.svg"
            alt="Animated Pokémon roaming Mauville City"
            style={{ height: "120px", width: "auto", flexShrink: 0, display: "block" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pokemon-roam-mauville.svg"
            alt=""
            aria-hidden="true"
            style={{ height: "120px", width: "auto", flexShrink: 0, display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
