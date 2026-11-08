# caden.work

Static portfolio site. No framework, no dependencies: one content file, one build script.

## Change the content

1. Edit `content.json`. Add a project by copying one block in `"projects"` (title, year, summary, tags, links).
   Projects show in the order they are listed, so put the newest first.
2. Run `node build.mjs`. The site is written to `dist/`.
3. Replace the resume: put the new PDF at `public/docs/Caden-Harris-Resume.pdf` and build again.

## Deploy (GitHub Pages)

The workflow in `.github/workflows/pages.yml` builds the site and publishes `dist/` on every push to `main`.
One-time setup: repo Settings > Pages > Build and deployment > Source = **GitHub Actions**.
The custom domain comes from `public/CNAME` (caden.work), so DNS does not change.

## Design notes

- Pale sage paper, moss-green links, one rust stamp on the availability card. Cards lift and tilt a little on hover.
- The footer has soft watercolor washes and loose brush marks, made as SVG from fixed seeds. Section headings get a small brush swash. The stamp has an inked, uneven edge.
- Fonts from Google Fonts: Libre Caslon Text (headings), IBM Plex Sans (text), DM Mono (labels).

## Project images

Put a 1200x750 image in `public/img/` and set `"image"`, `"alt"`, and optional `"focus"` (CSS object-position) on the project in `content.json`.
A project with no image shows text only.

## Card, stamp, and footer

- `"available".rows` fills the card at the top. Delete the whole `"available"` block to hide the card.
- `"available".showStamp`: `true` shows the "Open to work" stamp, `false` hides it.
- `"footer".heading` sets the footer heading.
