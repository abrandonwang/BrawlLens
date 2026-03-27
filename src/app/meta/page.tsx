import MapsPageClient from "./MapsPageClient"

export default function MetaPage() {
  return (
    <div className="bg-black h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden">
      <MapsPageClient />
    </div>
  )
}
