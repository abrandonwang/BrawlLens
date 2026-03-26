import MetaDashboard from "@/components/MetaDashboard";

export default function MetaPage() {
  return (
    <div className="bg-black flex-1 -mt-[80px] pt-[80px]">
      <main className="pt-32 pb-16">
        <div className="max-w-[1200px] mx-auto px-10">
          <section className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
              Maps
            </h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Win rates per brawler on every active map. Powered by{" "}
              <span className="text-white/60 font-semibold">
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