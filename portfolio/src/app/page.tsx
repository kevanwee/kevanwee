import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import { PokemonWalkerClient, IcaFloatClient } from "@/components/ClientWidgets";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <MediaAppearances />
        {/* Pokemon walker strip */}
        <div className="mx-auto max-w-4xl px-6 py-4 md:px-10">
          <PokemonWalkerClient />
        </div>
        <Contact />
      </main>
      <IcaFloatClient />
    </div>
  );
}
