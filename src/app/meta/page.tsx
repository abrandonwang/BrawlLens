import MetaDashboard from "@/components/MetaDashboard";

export default function MetaPage() {
  return (
    <div className="bg-black flex-1">
      <main className="pt-32 pb-16">
        <div className="max-w-[1200px] mx-auto px-10">
          <section className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
              Brawl Stars Maps | Current Rotations
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Browse all  active maps across  game modes with best brawlers and win rates for each map. Powered by{" "}
              <span className="text-white/80 font-semibold">
                battle data from top-ranked players
              </span>{" "}
              across 6 regions.
            </p>
          </section>
          <MetaDashboard />
        </div>
      </main>
    </div>
  );
}