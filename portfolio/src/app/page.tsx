import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
export default function Home() {
  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Mobile-only sticky nav */}
      <div className="lg:hidden">
        <Nav />
      </div>

      <div className="lg:flex">
        {/* Left sidebar — fixed, desktop only */}
        <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-[44%] lg:border-r lg:border-cream-200 lg:overflow-hidden">
          <LeftPanel />
        </aside>

        {/* Right — scrollable content */}
        <main className="lg:ml-[44%]">
          {/* Mobile hero (hidden on desktop since LeftPanel shows it) */}
          <div className="lg:hidden">
            <Hero />
          </div>
          <About />
          <Experience />
          <Projects />
          <MediaAppearances />
          <Contact />
        </main>
      </div>

    </div>
  );
}
