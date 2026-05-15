import Image, { type ImageProps } from "next/image"

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string
  alt: string
}

export function BrawlImage({ src, alt, sizes = "96px", ...props }: Props) {
  return (
    <Image
      src={normalizeBrawlAssetUrl(src)}
      alt={alt}
      sizes={sizes}
      unoptimized
      {...props}
    />
  )
}

export function normalizeBrawlAssetUrl(src: string) {
  return src
    .replace("cdn.brawlify.com/gadgets/borderless/", "cdn.brawlify.com/gadgets/regular/")
    .replace("cdn.brawlify.com/star-powers/borderless/", "cdn.brawlify.com/star-powers/regular/")
}

export function brawlerIconUrl(id: number) {
  return `https://cdn.brawlify.com/brawlers/borderless/${id}.png`
}

export function profileIconUrl(id: number) {
  return `/api/player-icon?id=${encodeURIComponent(id)}`
}
