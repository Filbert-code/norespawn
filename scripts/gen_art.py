#!/usr/bin/env python3
"""
NoRespawn exercise art generator.

Calls fal.ai's OpenAI GPT Image 2 endpoint (`openai/gpt-image-2`) for each
exercise, saves the raw PNG exactly as returned, and also writes an optimized
WebP for shipping in the app.

Usage:
    python scripts/gen_art.py                       # generate any missing art
    python scripts/gen_art.py --force               # regenerate everything
    python scripts/gen_art.py --only bench_press    # one (or a comma list)
    python scripts/gen_art.py --batch 1 --of 4      # run batch 1 of 4

Job source: if scripts/exercises.json exists (a JSON array exported from the
Supabase `exercise` table) it is used as the full catalog; otherwise the small
built-in TEST_JOBS set is used. Export it with:

    select coalesce(json_agg(json_build_object(
             'slug', slug, 'name', name, 'equipment', equipment_slug,
             'movement_pattern', movement_pattern, 'instructions', instructions
           ) order by slug), '[]'::json)
    from exercise
    where is_archived = false;

Requires FAL_KEY in .env (see .env.example). Install deps with:
    pip install -r scripts/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import math
import ssl
import time
import urllib.request
from io import BytesIO
from pathlib import Path

import certifi
from dotenv import load_dotenv
from PIL import Image

# Use certifi's CA bundle for downloads. macOS Python installs often ship
# without working system roots, which makes urllib reject fal's media CDN with
# CERTIFICATE_VERIFY_FAILED even though the cert chain is valid.
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())

# --- Paths ------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "assets" / "exercises"
RAW_DIR = OUT_DIR / "raw"
MANIFEST = ROOT / "scripts" / "art.manifest.json"
# Full catalog export (JSON array) produced by the Supabase query in the README
# at the bottom of this file. When present, it overrides the built-in test JOBS.
EXERCISES_JSON = ROOT / "scripts" / "exercises.json"

# UI backgrounds (banners/panels) live separately from exercise art.
UI_DIR = ROOT / "src" / "assets" / "ui"
UI_RAW_DIR = UI_DIR / "raw"
UI_MANIFEST = ROOT / "scripts" / "ui.manifest.json"

# Load FAL_KEY from .env into the environment so fal_client picks it up.
load_dotenv(ROOT / ".env")

import fal_client  # noqa: E402  (import after load_dotenv so the key is present)

# --- Model knobs ------------------------------------------------------------
# The exact model fal exposes for OpenAI's image model. Selected purely by this
# string; fal does not silently substitute another model.
MODEL = "openai/gpt-image-2"

# gpt-image-2 accepts preset size names (not WxH strings) and a quality knob.
# It does NOT take a seed, so every generation is a fresh random composition.
IMAGE_SIZE = "square"   # ~816x816 at this preset
QUALITY = "low"         # low | medium | high | auto  (cost/detail tradeoff)
OUTPUT_FORMAT = "png"   # raw download format

# Shipped WebP fidelity. Native resolution, near-lossless quality so the
# optimized asset stays faithful to the raw output.
WEBP_QUALITY = 90

# --- Frozen grimdark house style --------------------------------------------
STYLE_PREFIX = (
    "grimdark Warhammer-style dark oil painting of a single lone hooded "
    "muscular ascetic warrior-monk"
)
STYLE_SUFFIX = (
    "mid-effort and straining, single centered figure, hooded face in deep "
    "shadow, near-black background, oxblood and crimson accents, dramatic "
    "bronze rim-light, drifting ash and faint embers, gothic cathedral gloom, "
    "weathered iron, matte painterly texture, heavy shadow and vignette, "
    "ominous and masculine, square composition, no text, no watermark, no logos"
)


def build_prompt(movement: str) -> str:
    return f"{STYLE_PREFIX} {movement}, {STYLE_SUFFIX}"


# --- UI background style -----------------------------------------------------
# Backgrounds sit BEHIND text/icons, so the shared style emphasises dark,
# atmospheric, low-detail negative space and explicitly excludes any central
# subject. Same grimdark palette as the exercise art for visual continuity.
UI_STYLE_SUFFIX = (
    "grimdark Warhammer atmosphere, deep shadow, heavy vignette, oxblood and "
    "crimson and bronze accents, drifting ash and faint embers, weathered iron "
    "and gothic cathedral stone, matte painterly texture, cinematic and moody, "
    "dark empty low-detail negative space in the center for overlaid UI, "
    "no people, no figures, no text, no letters, no symbols, no logos, no border"
)


def build_ui_prompt(scene: str) -> str:
    return f"{scene}, {UI_STYLE_SUFFIX}"


# Each UI background: a stable `name` (the output filename), a `scene` clause,
# and an `image_size` (a gpt-image-2 preset string OR a {width, height} dict).
# gpt-image-2 caps the aspect ratio at 3:1, so banners wider than that are
# generated at 3:1 and cropped to fit via object-cover in the app.
UI_JOBS: list[dict] = [
    {
        # The banner is ~5.4:1 but the model caps at 3:1. So generate a TALLER
        # 3:2 frame with the embers concentrated in a horizontal ribbon across
        # the middle, then crop just that ribbon (center band, ~5:1) so the
        # shipped asset matches the banner with no ugly crop in the app.
        "name": "streak_banner",
        "scene": "a single narrow horizontal ribbon of smouldering molten forge "
        "coals and glowing embers running straight across the exact middle from "
        "edge to edge, fading into deep solid black empty darkness both above and "
        "below the ribbon, a few faint rising sparks",
        "image_size": {"width": 1536, "height": 1024},
        "crop": {"top": 0.30, "height": 0.30},
    },
    {
        "name": "planned_workout",
        "scene": "a dim grimdark armory wall, racked iron weapons and hanging "
        "chains in heavy shadow lit by faint crimson torchlight",
        "image_size": "landscape_4_3",
    },
    {
        "name": "rest_day",
        "scene": "a cold dormant forge in an empty gothic stone chamber, "
        "extinguished grey ashes, quiet muted blue-grey gloom, faint cold light",
        "image_size": "landscape_4_3",
    },
    {
        # One reusable plate tile, rendered behind each of the 3 nav buttons. A
        # single centered plate so each cropped copy reads as its own section.
        "name": "nav_plate",
        "scene": "a single weathered dark hammered iron plate, centered, with "
        "riveted corners and a worn bronze rim, flat head-on view, evenly lit",
        "image_size": "landscape_16_9",
    },
    {
        # Live-session backdrop. Tall portrait (phone screen) so it fills the
        # live workout frame with no landscape letterboxing. Battle-worn
        # blackened armor plating runs down the left and right edges; a faint
        # molten ember glow bleeds from the upper-center and fades to black,
        # leaving the vertical center column empty for the timer ring + controls.
        "name": "live_session_bg",
        "scene": "ornate battle-worn blackened steel and gunmetal armor plating "
        "with intricate engraved filigree and worn bronze trim covering the left "
        "and right sides top to bottom and arching across the top corners, "
        "overlapping riveted plates and interlocking panels, a vivid glowing "
        "molten crimson and bright ember-red glow blazing down from the upper "
        "center with hot glowing red cracks veining through the metal, sparks and "
        "embers, fading to deep solid black at the bottom, the whole vertical "
        "center left as dark empty space, highly detailed painterly concept art",
        "image_size": {"width": 1024, "height": 1536},
    },
]


# --- Jobs -------------------------------------------------------------------
# `slug` matches the catalog. Only `movement` varies per exercise; the style
# strings stay constant so the set reads as one coherent family.
#
# TEST_JOBS is the small hand-tuned set used while dialing in the look. The full
# run loads every exercise from scripts/exercises.json instead (see load_jobs).
TEST_JOBS: list[dict[str, str]] = [
    {
        "slug": "deadlift",
        "movement": "heaving a massive iron barbell off the ground in a "
        "deadlift, flat back, both hands gripping the bar",
    },
    {
        "slug": "barbell_bench_press",
        "movement": "lying back on a stone bench and pressing a heavy iron "
        "barbell straight up above the chest",
    },
    {
        "slug": "barbell_back_squat",
        "movement": "standing in a deep squat with a heavy iron barbell racked "
        "across the shoulders",
    },
    {
        "slug": "barbell_bicep_curl",
        "movement": "curling a heavy iron barbell upward with both arms, elbows "
        "tucked to the sides",
    },
    {
        "slug": "pull_up",
        "movement": "hanging from an iron bar at the top of a pull-up, chin "
        "above the bar",
    },
    {
        "slug": "overhead_press",
        "movement": "standing tall and pressing a heavy iron barbell straight "
        "overhead with both arms locked out",
    },
    {
        "slug": "dumbbell_lateral_raise",
        "movement": "raising two heavy iron dumbbells out to the sides at "
        "shoulder height, arms extended",
    },
    {
        "slug": "kettlebell_swing",
        "movement": "swinging a heavy iron kettlebell forward to chest height "
        "with both hands, hips driving the motion",
    },
    {
        "slug": "plank",
        "movement": "holding a rigid forearm plank on the stone floor, body "
        "straight and braced, seen from the side",
    },
    {
        "slug": "box_jump",
        "movement": "leaping explosively onto a tall stone block, mid-air at "
        "the top of a box jump, knees rising",
    },
]


def humanize(slug: str | None) -> str:
    return (slug or "").replace("_", " ").replace("-", " ").strip()


def build_movement(row: dict) -> str:
    """Build a per-exercise movement clause from a catalog row.

    gpt-image-2 understands named exercises well, so the exercise name carries
    most of the signal. We add the equipment when the name doesn't already imply
    it, which sharpens props (barbell, dumbbell, kettlebell, cable, etc.).
    """
    name = (row.get("name") or row.get("slug") or "").strip()
    equipment = humanize(row.get("equipment"))
    movement = f"performing a {name.lower()}, mid-rep under heavy effort"
    if equipment and equipment.lower() not in name.lower() and equipment.lower() not in (
        "bodyweight",
        "none",
    ):
        movement += f", using a {equipment}"
    return movement


def load_jobs() -> list[dict[str, str]]:
    """Prefer the full catalog export; fall back to the built-in test set."""
    if EXERCISES_JSON.exists():
        rows = json.loads(EXERCISES_JSON.read_text())
        jobs = [{"slug": r["slug"], "movement": build_movement(r)} for r in rows if r.get("slug")]
        # Deterministic order so --batch splits are stable across runs.
        jobs.sort(key=lambda j: j["slug"])
        return jobs
    return TEST_JOBS


def load_manifest(path: Path = MANIFEST) -> dict:
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_manifest(manifest: dict, path: Path = MANIFEST) -> None:
    """Persist the manifest atomically, merging with what's already on disk.

    Merging means concurrent batch runs (e.g. all 4 at once) accumulate instead
    of clobbering each other: our fresh in-memory entries win, and any entries
    only present on disk are preserved.
    """
    try:
        disk = json.loads(path.read_text())
        if isinstance(disk, dict):
            for key, entry in disk.items():
                manifest.setdefault(key, entry)
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    tmp.replace(path)


def subscribe_with_retry(prompt: str, label: str, image_size: str = IMAGE_SIZE) -> dict:
    """Call fal, retrying transient failures with backoff."""
    last_err: Exception | None = None
    for attempt in range(1, 5):
        try:
            return fal_client.subscribe(
                MODEL,
                arguments={
                    "prompt": prompt,
                    "image_size": image_size,
                    "quality": QUALITY,
                    "num_images": 1,
                    "output_format": OUTPUT_FORMAT,
                },
                with_logs=False,
            )
        except Exception as err:  # noqa: BLE001 - retry any transient fal error
            last_err = err
            if attempt == 4:
                break
            wait = 1.5 * attempt
            print(f"  retry {label} (attempt {attempt} failed: {err}); waiting {wait:.0f}s")
            time.sleep(wait)
    assert last_err is not None
    raise last_err


def apply_crop(img: Image.Image, crop: dict | None) -> Image.Image:
    """Crop a fractional box {left,top,width,height} (0-1) out of the image.

    Lets us generate a taller image (the model caps aspect at 3:1) and then keep
    only a wide horizontal ribbon, so the shipped asset matches an extreme banner
    aspect with no further cropping in the app. Missing keys default to full.
    """
    if not crop:
        return img
    w, h = img.size
    left = int(round(crop.get("left", 0.0) * w))
    top = int(round(crop.get("top", 0.0) * h))
    right = left + int(round(crop.get("width", 1.0) * w))
    bottom = top + int(round(crop.get("height", 1.0) * h))
    return img.crop((max(0, left), max(0, top), min(w, right), min(h, bottom)))


def render(
    label: str,
    prompt: str,
    image_size,
    out_path: Path,
    raw_path: Path,
    crop: dict | None = None,
) -> tuple[int, int]:
    """Generate one image: fetch, save the full raw PNG + an optimized WebP.

    The raw PNG is always saved uncropped so the crop can be re-derived later
    (see --recrop) without spending another API call.
    """
    result = subscribe_with_retry(prompt, label, image_size)
    images = result.get("images") or []
    url = images[0].get("url") if images else None
    if not url:
        raise RuntimeError(f"no image returned for {label}: {result}")

    with urllib.request.urlopen(url, context=SSL_CONTEXT) as resp:
        raw_bytes = resp.read()

    raw_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(raw_bytes)

    img = apply_crop(Image.open(BytesIO(raw_bytes)).convert("RGB"), crop)
    img.save(out_path, "WEBP", quality=WEBP_QUALITY, method=6)
    return img.size


def manifest_entry(prompt: str, image_size=IMAGE_SIZE, crop: dict | None = None) -> dict:
    entry = {
        "model": MODEL,
        "image_size": image_size,
        "quality": QUALITY,
        "prompt": prompt,
    }
    if crop:
        entry["crop"] = crop
    return entry


def generate(job: dict[str, str], manifest: dict, force: bool) -> None:
    slug = job["slug"]
    webp_path = OUT_DIR / f"{slug}.webp"
    if webp_path.exists() and not force:
        # Already generated. Still ensure the manifest records it so the
        # manifest stays 1:1 with the files on disk.
        if slug not in manifest:
            manifest[slug] = manifest_entry(build_prompt(job["movement"]))
            save_manifest(manifest)
        print(f"  skip {slug} (already exists)")
        return

    prompt = build_prompt(job["movement"])
    print(f"-> gen  {slug}")
    w, h = render(slug, prompt, IMAGE_SIZE, webp_path, RAW_DIR / f"{slug}.png")

    manifest[slug] = manifest_entry(prompt)
    # Persist immediately so an interrupt mid-batch never loses a completed
    # image's record. The files on disk are already written above.
    save_manifest(manifest)
    print(f"   done {slug} -> {webp_path.relative_to(ROOT)} ({w}x{h}) + raw png")


def generate_ui(job: dict, manifest: dict, force: bool) -> None:
    name = job["name"]
    image_size = job["image_size"]
    crop = job.get("crop")
    prompt = build_ui_prompt(job["scene"])
    webp_path = UI_DIR / f"{name}.webp"
    if webp_path.exists() and not force:
        if name not in manifest:
            manifest[name] = manifest_entry(prompt, image_size, crop)
            save_manifest(manifest, UI_MANIFEST)
        print(f"  skip {name} (already exists)")
        return

    print(f"-> gen  {name} ({image_size})")
    w, h = render(name, prompt, image_size, webp_path, UI_RAW_DIR / f"{name}.png", crop)
    manifest[name] = manifest_entry(prompt, image_size, crop)
    save_manifest(manifest, UI_MANIFEST)
    print(f"   done {name} -> {webp_path.relative_to(ROOT)} ({w}x{h}) + raw png")


def recrop_ui(jobs: list[dict]) -> None:
    """Re-derive each UI WebP from its saved raw PNG using the job's crop spec.

    No API calls — used to iterate on a banner's crop band for free.
    """
    for job in jobs:
        name = job["name"]
        raw_path = UI_RAW_DIR / f"{name}.png"
        if not raw_path.exists():
            print(f"  skip {name} (no raw png — run --ui --force first)")
            continue
        img = apply_crop(Image.open(raw_path).convert("RGB"), job.get("crop"))
        out_path = UI_DIR / f"{name}.webp"
        img.save(out_path, "WEBP", quality=WEBP_QUALITY, method=6)
        w, h = img.size
        print(f"   recrop {name} -> {out_path.relative_to(ROOT)} ({w}x{h})")


def reconcile(jobs: list[dict[str, str]]) -> None:
    """Rebuild manifest entries for every image already on disk (no API calls).

    Used to repair a manifest that fell out of sync with the files (e.g. from
    skipped images or concurrent batch runs that clobbered each other).
    """
    prompt_by_slug = {j["slug"]: build_prompt(j["movement"]) for j in jobs}
    for j in TEST_JOBS:
        prompt_by_slug.setdefault(j["slug"], build_prompt(j["movement"]))

    manifest = load_manifest()
    webps = sorted(p.stem for p in OUT_DIR.glob("*.webp"))
    added: int = 0
    unknown: list[str] = []
    for slug in webps:
        if slug in manifest:
            continue
        prompt = prompt_by_slug.get(slug)
        if prompt is None:
            unknown.append(slug)
            continue
        manifest[slug] = manifest_entry(prompt)
        added += 1

    save_manifest(manifest)
    print(
        f"Reconciled: {len(webps)} images on disk, "
        f"{len(manifest)} manifest entries ({added} added)."
    )
    if unknown:
        print(f"  WARNING: {len(unknown)} images have no known prompt source: {unknown}")


def run_ui(args: argparse.Namespace) -> None:
    """Generate the UI background set into src/assets/ui/."""
    jobs = UI_JOBS
    if args.only:
        only = set(args.only.split(","))
        jobs = [j for j in jobs if j["name"] in only]
    if not jobs:
        raise SystemExit("No matching UI jobs.")

    if args.recrop:
        print(f"Recropping {len(jobs)} UI background(s) from raw PNGs.")
        recrop_ui(jobs)
        return

    print(f"UI backgrounds: {len(jobs)} this run.")

    manifest = load_manifest(UI_MANIFEST)
    done = 0
    try:
        for job in jobs:
            try:
                generate_ui(job, manifest, args.force)
                done += 1
            except Exception as err:  # noqa: BLE001 - keep going on single failure
                print(f"x FAIL {job['name']}: {err}")
    finally:
        save_manifest(manifest, UI_MANIFEST)
        print(f"\nManifest written -> {UI_MANIFEST.relative_to(ROOT)} ({done}/{len(jobs)} this run)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate exercise art via fal gpt-image-2")
    parser.add_argument("--force", action="store_true", help="regenerate even if art exists")
    parser.add_argument("--only", type=str, default=None, help="comma-separated slugs to generate")
    parser.add_argument("--batch", type=int, default=None, help="1-indexed batch to run (with --of)")
    parser.add_argument("--of", type=int, default=None, help="total number of batches to split into")
    parser.add_argument(
        "--reconcile",
        action="store_true",
        help="rebuild manifest entries for every existing image (no API calls)",
    )
    parser.add_argument(
        "--ui",
        action="store_true",
        help="generate UI background art (src/assets/ui/) instead of exercises",
    )
    parser.add_argument(
        "--recrop",
        action="store_true",
        help="(with --ui) re-derive WebPs from saved raw PNGs using crop specs; no API calls",
    )
    args = parser.parse_args()

    import os

    if args.ui:
        # Recrop works entirely from local raw PNGs, so it needs no API key.
        if not args.recrop and not os.environ.get("FAL_KEY"):
            raise SystemExit("Missing FAL_KEY - add it to .env (FAL_KEY=...). See .env.example.")
        run_ui(args)
        return

    jobs = load_jobs()

    if args.reconcile:
        reconcile(jobs)
        return

    if not os.environ.get("FAL_KEY"):
        raise SystemExit("Missing FAL_KEY - add it to .env (FAL_KEY=...). See .env.example.")

    source = "exercises.json" if EXERCISES_JSON.exists() else "built-in TEST_JOBS"
    print(f"Loaded {len(jobs)} exercises from {source}.")

    if args.only:
        only = set(args.only.split(","))
        jobs = [j for j in jobs if j["slug"] in only]

    if args.batch is not None or args.of is not None:
        if not (args.batch and args.of) or args.batch < 1 or args.batch > args.of:
            raise SystemExit("Use --batch N --of M, with 1 <= N <= M.")
        per = math.ceil(len(jobs) / args.of)
        start = (args.batch - 1) * per
        jobs = jobs[start : start + per]
        print(f"Batch {args.batch}/{args.of}: {len(jobs)} exercises this run.")

    if not jobs:
        raise SystemExit("No matching jobs.")

    manifest = load_manifest()
    done = 0
    try:
        for job in jobs:
            try:
                generate(job, manifest, args.force)
                done += 1
            except Exception as err:  # noqa: BLE001 - keep batch going on single failure
                print(f"x FAIL {job['slug']}: {err}")
    finally:
        # Backstop: the manifest is already saved after each success, but write
        # once more so it's flushed even if the loop exits early (Ctrl-C, etc.).
        save_manifest(manifest)
        print(f"\nManifest written -> {MANIFEST.relative_to(ROOT)} ({done}/{len(jobs)} this run)")


if __name__ == "__main__":
    main()
