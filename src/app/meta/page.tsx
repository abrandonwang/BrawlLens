import MapsPageClient from "./MapsPageClient"

export default function MetaPage() {
  return (
    <div className="bg-white h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden dark:bg-black">
      <MapsPageClient />
    </div>
  )
}
