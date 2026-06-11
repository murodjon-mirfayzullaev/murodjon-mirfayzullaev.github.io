# Murodjon Mirfayzullaev — Portfolio

A minimalist personal résumé / portfolio site. **Buildless** — plain HTML, CSS,
and vanilla JS. No framework, no bundler, no pipeline. It deploys to GitHub Pages
as-is.

## Features

- **Collapsible left sidebar** navigation (desktop) that collapses to an
  icon-only rail; on mobile it becomes an off-canvas drawer (hamburger on the
  left, download button on the right). The collapsed/expanded choice is
  remembered.
- **Sticky top bar** with a **live clock** showing the author's local time in
  Uzbekistan (Asia/Tashkent, AM/PM) and a **Download CV** action.
- **Download CV bottom sheet** — pick a language (defaults to the active site
  language) and download the matching PDF from `CV files/`.
- **Three languages** (English / Russian / Uzbek) via a dropdown language
  switcher; the choice is persisted and re-applied on load.
- Responsive, with tasteful fade-in / hover animations (all respect
  `prefers-reduced-motion`).

## Folder structure

```
PersonalResumeWebsite/
├── index.html          # Home (profile + active-jobs widget)
├── projects.html       # Projects (banner + tool marquee + grid)
├── experience.html     # Job Experience (timeline)
├── contact.html        # Contact me (+ Links / social section)
├── blog.html           # Blog — title + "Coming soon"
├── .nojekyll           # tells GitHub Pages to skip Jekyll processing
├── README.md
├── CV files/           # downloadable résumé PDFs (EN / RU / UZ)
├── projects/           # project content (see "Editing the Projects page")
│   ├── registry.json   # ordered list of project ids to display
│   ├── badges.json     # tool badges for the marquee
│   ├── banner.json     # banner content
│   └── project-01/ …   # one folder per project: project.json + thumbnail + assets/
├── assets/
│   ├── css/styles.css  # all styling + responsive + animations
│   ├── js/main.js      # sidebar/topbar/footer injection, i18n, clock, theme, sheet
│   ├── js/home.js      # home widgets   ├── js/experience.js   └── js/projects.js
│   └── img/profile.jpg
└── data/
    ├── content.json    # language-neutral data: name, contact, photo, CV paths, social
    ├── i18n.json       # all translatable strings for en / ru / uz
    └── experience/     # one JSON file per job + index.json (display order)
```

### Editing the Projects page (no code needed)

Project content lives under `projects/`. The grid renders whatever is listed in
`projects/registry.json`.

- **Add a project** → create `projects/<id>/` with a `project.json` and a
  `thumbnail` (jpg/png/webp/svg), then add `"<id>"` to `registry.json`.
- **Reorder / remove** → edit the `projects` array in `registry.json`.
- **Tool badges** (the auto-scrolling marquee) → edit `projects/badges.json`:
  `{ id, label, color }`. Each badge is a minimal pill — `label` text plus a
  small dot in `color`, on a uniform surface background.
- **Banner** → `projects/banner.json` exists (localized heading/subheading,
  optional `image`/`contact`/`cta`) but the banner is currently hidden on the
  page; it can be re-enabled later.
- `project.json` holds `title`, `thumbnail`, `views`, and a `media` array
  (image/video/svg) used by the project detail view (coming later — for now a
  card click opens an empty "Coming soon" bottom sheet).

### Editing the Job Experience page (no code needed)

Each job lives in its own file in `data/experience/` (e.g. `karmon-ai.json`)
with `en` / `ru` / `uz` sections. The page renders whatever is listed in
`data/experience/index.json`, top to bottom.

- **Edit a job** → open its JSON file and change the text.
- **Add a job** → copy an existing file, rename it, edit the content, then add
  its filename to the `jobs` list in `index.json`.
- **Reorder / remove** → just reorder or delete entries in `index.json`.
- `"current": true` shows the "Current" badge. `highlights` and `results` are
  optional — leave them as `[]` to hide those blocks.

### Where content lives (no hardcoded copy)

- **Language-neutral facts** (name, email, phone, image paths, CV file paths,
  timezone, social URLs) → [`data/content.json`](data/content.json).
- **Everything translatable** (nav labels, headline, bio, clock label, CV-sheet
  text, page titles, footer) → [`data/i18n.json`](data/i18n.json), keyed by
  `en` / `ru` / `uz`.
- HTML only holds the structure; text is filled in at runtime via
  `data-i18n="<key>"` and `data-content="<field>"` attributes.

### Shared layout (DRY)

The sidebar nav, top bar, footer, and download sheet are built once in
[`assets/js/main.js`](assets/js/main.js) and injected into placeholders that
exist on every page. To add a nav item, edit the `NAV_ITEMS` array (one place).

### CV files

The downloadable PDFs live in the `CV files/` folder. Their paths are listed in
`data/content.json` under `cv` (the space in the folder name is URL-encoded as
`%20`). Replace the PDFs there to update the downloads — no code change needed.

## Run it locally

Because the site fetches JSON, you need to serve it over HTTP (opening
`index.html` directly via `file://` will be blocked by the browser, and the nav
won't appear). Any static server works:

```bash
# Python (already installed)
python -m http.server 8000
# then open http://localhost:8000

# or, with Node
npx serve .
```

## Push to GitHub

The local git repository is already initialized and committed. To publish:

```bash
# create an empty repo on GitHub first (no README/license), then:
git remote add origin https://github.com/<user>/<repo-name>.git
git push -u origin main
```

## Deploy to GitHub Pages

1. After pushing, go to the repo **Settings → Pages → Build and deployment →
   Source: Deploy from a branch**, pick `main` and the `/ (root)` folder.
2. The site publishes at `https://<user>.github.io/<repo-name>/`.

### About the project base path (`/repo-name/`)

A project site lives under a sub-path (`/repo-name/`), not the domain root. This
site uses **relative asset paths** (`assets/...`, `data/...`, `CV%20files/...`,
`index.html`, etc.) — never leading slashes — so it works under that sub-path
with **no configuration changes**.

- ✅ Keep using relative links.
- ❌ Don't switch to absolute paths (`/assets/...`) — those break under a project
  sub-path. Absolute paths are only needed for a user/org site served from the
  domain root (`<user>.github.io`).
- The included `.nojekyll` file ensures GitHub serves `assets/` and `CV files/`
  as-is without running Jekyll.
