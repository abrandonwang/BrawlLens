import { Suspense } from "react"
import MapsPageClient from "./MapsPageClient"

export default function MetaPage() {
  return (
    <div className="">
      <Suspense>
        <MapsPageClient />
      </Suspense>
    </div>
  )
}
