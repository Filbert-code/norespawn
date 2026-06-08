# NoRespawn — Art Style Bible & Asset Pipeline

This is the source of truth for generating and shipping the AI-driven artwork in
NoRespawn. The goal is a cohesive **grimdark Warhammer-40K Imperial** look across
every screen — not a folder of one-off cool images. Treat asset generation like a
production pipeline: lock the style, anchor the prompt, vary only the subject.

---

## 1. Style anchor (the ~80% of every prompt that never changes)

> Grimdark Warhammer-40K Imperial gothic art style. Ultra-detailed digital
> painting / AAA game UI key-art. Dramatic chiaroscuro lighting, high contrast,
> atmospheric. Oxidized bronze filigree, riveted gunmetal plates, carved stone
> skulls, dried-blood crimson lacquer, parchment purity-seals, hanging chains.
> Volumetric dim crimson god-rays, floating ember and ash motes, heavy inner
> vignette darkening the corners. Reverent, militant, intimidating.

**Material rules:** oxidized bronze, scratched steel, riveted iron, carved stone,
bone, blood-red lacquer. Light comes from **above**, crimson-tinted.

**Prohibited:** modern flat UI, neon, pastels, cartoon shading, lens flare,
photoreal humans, any color outside the palette, and — for background plates —
**any text, letters, or typography** (see §4).

## 2. Palette (strict — these are the live CSS tokens)

| Token            | Hex       | Use                                  |
| ---------------- | --------- | ------------------------------------ |
| `nr-black`       | `#0c0c0e` | base background                      |
| `nr-gunmetal`    | `#1a1b1e` | panels, plates                       |
| `nr-oxblood`     | `#7f1d1d` | deep shadow accents                  |
| `nr-crimson`     | `#b91c1c` | primary action / blood glow          |
| `nr-ember`       | `#ef4444` | hot highlights, ring/lava glow       |
| `nr-bronze`      | `#b08d57` | filigree, frames, dividers           |
| `nr-bone`        | `#ece5d8` | engraved highlights, text (sparing)  |

Always paste this exact table into the prompt as the "strict color palette".

## 3. Typography (live, never baked into art)

- **Headings:** Cinzel (Roman engraved imperial capitals), uppercase, wide tracking.
- **Body/labels:** Geist.
- Decorative display options live in the Typography Lab mockup (Grenze Gotisch, Pirata One).

## 4. The golden rule: separate ART from UI

Generated raster images carry **atmosphere, texture, ornamentation** only.
Everything functional or textual is **live HTML / CSS / SVG** layered on top.

| Layer            | Tech                              | Why                                    |
| ---------------- | --------------------------------- | -------------------------------------- |
| Background plate | AI raster (AVIF/WebP via `<picture>`) | painterly depth CSS can't do        |
| Frames / buttons | SVG + CSS `border-image` (9-slice) | scales to any size, corners stay crisp |
| Emblems/dividers/icons | inline SVG (lucide etc.)     | infinitely sharp, recolorable by token |
| Text             | live Cinzel/Geist                 | crisp, translatable, accessible, selectable |
| Motion           | CSS (ash motes, glows)            | cheap, responsive, reduced-motion safe |

When generating a **background plate**, command "NO TEXT OF ANY KIND" and leave a
**clear, dark central band** so live UI has somewhere legible to sit. Verify final
text contrast ≥ 4.5:1; scrims/gradients live in CSS, not the image.
Mark decorative art layers `aria-hidden="true"` and `pointer-events-none`.

See `src/mockups/screens/Login.tsx` for the reference implementation of all five layers.

## 5. Consistency controls (how to keep 100 assets on-model)

1. **Prompt anchoring** — keep §1 + §2 verbatim in every prompt; change only the subject.
2. **Reference image** — pass an approved asset as a style reference (e.g. the login
   plate or `src/mockups/assets/live-session-bg.png`) on every new generation.
3. **Seeds** — when a generation nails the look, reuse its seed for siblings.
4. **Image-to-image** — for variations of an existing asset, use I2I so silhouette,
   scale, and placement stay locked.
5. **Batch + review** — generate 8–16 candidates, score each 1–5 on
   *palette, lighting, composition, on-style, UI-readiness*; reject < 4. Beautiful
   but off-style = archive as reference, don't ship.

## 6. Prompt template (copy/paste, fill the SUBJECT line)

```
SUBJECT: <what this asset is — e.g. "a wide desktop login background plate", "an
ornate inventory panel frame", "a circular skull achievement badge">
ASPECT RATIO: <e.g. 9:19.5 portrait | 16:9 landscape | 1:1>
COMPOSITION NOTES: <where to keep negative space for UI; what to emphasize>

STYLE (do not change): Grimdark Warhammer-40K Imperial gothic, ultra-detailed
digital painting / AAA game UI key-art, dramatic chiaroscuro, high contrast,
oxidized bronze filigree, riveted gunmetal, carved stone skulls, blood-red
lacquer, parchment purity-seals, chains, crimson god-rays from above, floating
embers/ash, heavy corner vignette. Reverent, militant, intimidating.

STRICT PALETTE: near-black #0c0c0e, gunmetal #1a1b1e, oxblood #7f1d1d, crimson
#b91c1c, ember #ef4444, bronze #b08d57, bone #ece5d8 (bone used sparingly).

PROHIBITED: text/letters/typography of any kind, modern flat UI, neon, pastels,
cartoon shading, photoreal humans, any off-palette color.
```

## 7. Shipping assets (performance)

- Drop source art in `src/mockups/assets/` (or `src/assets/`).
- Import through the pipeline to auto-generate optimized variants:
  ```ts
  import art from '@/mockups/assets/x.png?w=480;780;960&format=avif;webp;png&as=picture'
  ```
  Render with `<picture>` (AVIF source first, then WebP, PNG fallback `<img>`).
- **One** LCP image per screen gets `loading="eager"` + `fetchPriority="high"`;
  everything else `loading="lazy"`. Always set `width`/`height` to avoid layout shift.
- Art-direction (different crop per device) → multiple `<source media="...">`, not a
  single image stretched with `object-fit: cover`.
- **Pre-crop to the target aspect ratio.** Generators tend to emit ~3:2 landscape.
  Dropping that into a tall phone with `object-fit: cover` crops ~70% of the width
  and then *upscales* the narrow visible strip (looks soft / "low-res"). Instead,
  center-crop the source to the device aspect first (we use `sharp`), so the browser
  renders it near 1:1. Then cap the `?w=` variants at the cropped native width —
  requesting larger just upscales. See the crop step used for `login-bg.png`
  (1536×1024 → 478×1024 at the 0.467 phone aspect).
