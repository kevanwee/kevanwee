import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";

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
        <Contact />
      </main>
    </div>
  );
}
