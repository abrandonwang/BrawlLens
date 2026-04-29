import Image, { type ImageProps } from "next/image"

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string
  alt: string
}

export function BrawlImage({ src, alt, sizes = "96px", ...props }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      {...props}
    />
  )
}

export function brawlerIconUrl(id: number) {
  return `https://cdn.brawlify.com/brawlers/borderless/${id}.png`
}
