/**
 * Types for `vite-imagetools` query-string imports.
 *
 * Importing an image with `?...&as=picture` returns a structured object with a
 * `srcset` per format plus a fallback `img`, ready to feed a `<picture>`.
 *
 *   import bg from '@/assets/x.png?w=480;960&format=avif;webp;png&as=picture'
 *
 * `as=metadata`/raw URL imports keep Vite's default `string` typing.
 */
declare module '*as=picture' {
  const out: {
    sources: Record<string, string>
    img: { src: string; w: number; h: number }
  }
  export default out
}
