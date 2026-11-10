// Build: node build.mjs  ->  dist/ (index.html + everything in public/)
// All text comes from content.json. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";

const c = JSON.parse(readFileSync(new URL("./content.json", import.meta.url), "utf8"));
const esc = (s = "") => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m]);
const ext = (u) => /^https?:/.test(u);
const a = (l) => `<a href="${esc(l.url)}"${ext(l.url) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a>`;

// ---------- painted marks for the footer (seeded: same picture every build) ----------
function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const n1 = (v) => v.toFixed(1);

// Cut-paper shapes on thin stems (circles, half-moons, ovals, lens leaves), with rough hand-cut edges,
// plus a few faint paint specks. Simple forms that only suggest plants.
function meadow() {
  const W = 1440, H = 360, r = rng(21);
  const cols = ["#8a9d73", "#a9b796", "#d99a83", "#c9d2b8", "#c0674a", "#8a9d73"];
  let shapes = "", stems = "", specks = "";
  for (const x0 of [60, 150, 240, 320, 410, 1010, 1100, 1180, 1270, 1360, 700]) {
    const x = x0 + (r() - 0.5) * 30, h = 110 + r() * 160, col = cols[(r() * cols.length) | 0], kind = (r() * 4) | 0, sz = 18 + r() * 20, y = H - h;
    stems += `<path d="M${n1(x)} ${H} Q${n1(x + (r() - 0.5) * 24)} ${n1(H - h / 2)} ${n1(x)} ${n1(y)}"/>`;
    if (kind === 0) shapes += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(sz)}" fill="${col}"/>`;
    if (kind === 1) shapes += `<path d="M${n1(x - sz)} ${n1(y)} A${n1(sz)} ${n1(sz)} 0 0 1 ${n1(x + sz)} ${n1(y)}Z" fill="${col}"/>`;
    if (kind === 2) shapes += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(sz * 0.55)}" ry="${n1(sz * 1.2)}" fill="${col}" transform="rotate(${n1((r() - 0.5) * 30)} ${n1(x)} ${n1(y)})"/>`;
    if (kind === 3) shapes += `<path d="M${n1(x)} ${n1(y - sz)} Q${n1(x + sz)} ${n1(y)} ${n1(x)} ${n1(y + sz)} Q${n1(x - sz)} ${n1(y)} ${n1(x)} ${n1(y - sz)}Z" fill="${col}"/>`;
  }
  for (let i = 0; i < 22; i++) {
    const x = r() * W, y = 90 + r() * 230, rad = 1.2 + r() * 2.4;
    specks += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rad)}" fill="${r() < 0.5 ? "#d99a83" : "#8a9d73"}" opacity="${n1(0.18 + r() * 0.2)}"/>`;
  }
  return `<svg class="meadow" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <g filter="url(#cut)"><g fill="none" stroke="#8a9d73" stroke-width="2" opacity=".45">${stems}</g><g opacity=".55" style="mix-blend-mode:multiply">${shapes}</g></g>
  <g filter="url(#cut)">${specks}</g>
</svg>`;
}

// A short brush swash used under section headings.
const swash = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 24' preserveAspectRatio='none'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='2' seed='6'/><feDisplacementMap in='SourceGraphic' scale='4'/></filter><path filter='url(%23b)' d='M3 15 C40 9 110 8 196 11 C150 16 70 19 6 20 Z' fill='%23d99a83' opacity='.55'/></svg>")`;

// ---------- sections ----------
const av = c.available;
const stamp = av && av.stamp ? `<span class="stamp">${esc(av.stamp)}</span>` : "";
const card = av ? `<aside class="card" aria-label="At a glance">
  ${stamp}
  <dl>${av.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
</aside>` : "";

const links = [{ label: c.email, url: `mailto:${c.email}` }, ...c.links];

// Experience timeline: jobs, then education, newest first.
const entries = [
  ...c.experience.map((e) => ({ when: `${e.start} – ${e.end}`, title: e.role, org: e.org, points: e.points, logo: e.logo, kind: "Work" })),
  ...(c.education ? [{ when: `${c.education.start} – ${c.education.end}`, title: c.education.degree, org: c.education.school, points: c.education.points, logo: c.education.logo, kind: "Education" }] : []),
];
const experience = entries.map((e) => `<li class="tl-item">
  <p class="tl-when">${esc(e.when)}</p>
  <span class="tl-dot" aria-hidden="true"></span>
  <article class="job">
    ${e.logo ? `<img class="logo" src="${esc(e.logo)}" alt="${esc(e.org)} logo">` : ""}
    <p class="kind">${esc(e.kind)}</p>
    <h3>${esc(e.title)}<span class="at">${esc(e.org)}</span></h3>
    <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </article>
</li>`).join("");

// Projects: newest first, one even grid; the year sits on each card.
const projCard = (p) => `<article class="proj">
  ${p.image ? `<figure><img src="${esc(p.image)}" alt="${esc(p.alt || p.title)}" loading="lazy" style="object-position:${esc(p.focus || "50% 50%")}"></figure>` : ""}
  <div class="body">
    <p class="meta"><span>${esc(p.tags.join(" · "))}</span>${p.year ? `<span class="yr">${esc(p.year)}</span>` : ""}</p>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary)}</p>
    ${p.links.length ? `<p class="plinks">${p.links.map(a).join("")}</p>` : ""}
  </div>
</article>`;
const projects = c.projects.map(projCard).join("");

const skills = (c.skillGroups || [["Skills", c.skills]]).map(([g, list]) => `<div><dt>${esc(g)}</dt><dd>${list.map(esc).join(", ")}</dd></div>`).join("");

// ---------- footer ----------
const F = c.footer || { heading: "Get in touch" };
const year = new Date().getFullYear();
const footerHtml = `<footer class="f">
  <div class="wrap f-row">
    <div><h2 class="swash">${esc(F.heading)}</h2><a class="mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>
    <nav class="f-cols" aria-label="Footer">
      <div><p class="label">Site</p><ul><li><a href="#experience">Experience</a></li><li><a href="#projects">Projects</a></li><li><a href="#skills">Skills</a></li></ul></div>
      <div><p class="label">Elsewhere</p><ul>${c.links.map((l) => `<li>${a(l)}</li>`).join("")}</ul></div>
    </nav>
  </div>
  <div class="garden">${meadow()}<div class="f-credit"><div class="wrap"><span>© ${year} ${esc(c.name)}</span><span>caden.work</span></div></div></div>
</footer>`;

const noise = (freq, oct, alpha, seed, size) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .16 0 0 0 0 .18 0 0 0 0 .13 0 0 0 ${alpha} 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

const css = `
:root {
  --paper: #e8e9de; --sheet: #f4f3eb; --ink: #262c21; --soft: #687061; --leaf: #5c7646; --stamp: #9c3d2e; --line: #c7cab9;
  --display: "Libre Caslon Text", Georgia, serif; --text: "IBM Plex Sans", system-ui, sans-serif; --mono: "DM Mono", ui-monospace, monospace;
  color-scheme: light;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background-color: var(--paper); background-image: ${noise(".012", 3, ".05", 2, 600)}; color: var(--ink); font: 400 16px/1.6 var(--text); }
/* paper grain over everything, very light */
body::after { content: ""; position: fixed; inset: 0; z-index: 40; pointer-events: none; background-image: ${noise(".85", 2, ".13", 5, 240)}; mix-blend-mode: multiply; opacity: .55; }
a { color: var(--leaf); text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
a:focus-visible { outline: 2px solid var(--leaf); outline-offset: 3px; border-radius: 2px; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 16px; }
.label { margin: 0; font: 500 11.5px/1.4 var(--mono); letter-spacing: .16em; text-transform: uppercase; color: var(--soft); }
.sheet { background: var(--sheet); border: 1px solid var(--line); box-shadow: 0 1px 0 rgba(38,44,33,.04); }

/* masthead */
.mast { padding: 64px 0 52px; }
.mast .wrap { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 48px; align-items: start; }
h1 { margin: 14px 0 0; font: 400 clamp(44px, 8vw, 80px)/1 var(--display); letter-spacing: -.012em; }
.lede { margin: 20px 0 0; font-size: 18.5px; line-height: 1.6; max-width: 36rem; }
.links { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 22px 0 0; padding: 0; list-style: none; font: 400 13.5px/1.4 var(--mono); }
.card { position: relative; margin-top: 26px; background: var(--sheet); border: 1px solid var(--line); padding: 18px 18px 14px; transition: transform .25s ease, box-shadow .25s ease; }
.card:hover { transform: translateY(-3px) rotate(.3deg); box-shadow: 0 10px 22px rgba(38,44,33,.12); }
.card dl { margin: 0; font: 400 12.5px/1.6 var(--mono); }
.card dt { color: var(--soft); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; margin-top: 9px; }
.card dt:first-child { margin-top: 0; }
.card dd { margin: 1px 0 0; }
.stamp { filter: url(#ink); position: absolute; right: -10px; top: -14px; transform: rotate(8deg); border: 2px solid var(--stamp); color: var(--stamp); font: 700 11px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; padding: 6px 8px; border-radius: 3px; opacity: .85; background: var(--paper); }
body[data-stamp="off"] .stamp { display: none; }

/* sections */
section.wrap { padding-bottom: 64px; }
.shead { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin: 0 0 22px; padding-top: 18px; }
.swash, .shead h2 { display: inline-block; padding: 0 6px 0 2px; margin-left: -2px; background: ${swash} no-repeat 0 92% / 100% .62em; }
h2 { margin: 0; font: 400 30px/1.15 var(--display); }

/* timeline rail: year column, a hairline with dots, then content */
.tl { list-style: none; margin: 0; padding: 0; position: relative; --gut: 7.25rem; }
.tl::before { content: ""; position: absolute; left: calc(var(--gut) + 7px); top: 10px; bottom: 10px; width: 1px; background: linear-gradient(var(--line), var(--line) 85%, transparent); }
.tl-item { position: relative; display: grid; grid-template-columns: var(--gut) 15px minmax(0, 1fr); column-gap: 18px; padding-bottom: 18px; }
.tl-when { margin: 16px 0 0; font: 500 12.5px/1.4 var(--mono); color: var(--leaf); text-align: right; }
.tl-dot { margin-top: 19px; width: 9px; height: 9px; border-radius: 50%; background: var(--paper); border: 1.5px solid var(--leaf); justify-self: center; position: relative; z-index: 1; }

.job { position: relative; background: var(--sheet); border: 1px solid var(--line); padding: 16px 20px 16px; transition: transform .25s ease, box-shadow .25s ease; }
.job:hover, .proj:hover { transform: translateY(-3px) rotate(-.3deg); box-shadow: 0 10px 22px rgba(38,44,33,.12); }
.logo { position: absolute; right: 18px; top: 16px; height: 30px; width: auto; max-width: 96px; object-fit: contain; opacity: .55; }
.kind { margin: 0 0 2px; font: 500 11px/1.4 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--soft); }
.job h3 { margin: 0; padding-right: 110px; font: 400 21px/1.3 var(--display); }
.at { display: block; font: 400 15px/1.5 var(--text); color: var(--soft); margin-top: 2px; }
.job ul { margin: 8px 0 0; padding-left: 18px; }
.job li { margin: 4px 0; }
.job li::marker { color: var(--leaf); }

.projects { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 1000px) { .projects { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .projects { grid-template-columns: 1fr; } }
.proj { background: var(--sheet); border: 1px solid var(--line); display: flex; flex-direction: column; transition: transform .25s ease, box-shadow .25s ease; }
.proj figure { margin: 10px 10px 0; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid var(--line); background: var(--paper); }
.proj img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s ease; }
.proj:hover img { transform: scale(1.03); }
.proj .body { padding: 10px 14px 14px; display: grid; gap: 5px; }
.proj .meta { margin: 0; display: flex; justify-content: space-between; gap: 8px; font: 500 11px/1.4 var(--mono); color: var(--leaf); letter-spacing: .02em; }
.proj .yr { color: var(--soft); }
.proj h3 { margin: 0; font: 400 18px/1.25 var(--display); }
.proj p { margin: 0; font-size: 14.5px; line-height: 1.5; }
.plinks { display: flex; gap: 16px; margin-top: 2px !important; font: 400 12.5px/1.4 var(--mono) !important; }

.skills { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.skills > div { background: var(--sheet); border: 1px solid var(--line); padding: 14px 18px; }
.skills dt { font: 500 11.5px/1.4 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--soft); }
.skills dd { margin: 6px 0 0; }

/* footer */
.f { position: relative; margin-top: 40px; }
.f-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 32px; padding-top: 8px; padding-bottom: 8px; }
.f .label { margin-bottom: 8px; }
.f ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 15px; }
.f-cols { display: flex; gap: 56px; }
.f-cols a { color: var(--ink); }
.mail { display: table; margin-top: 14px; font: 400 15px/1.4 var(--mono); }
.garden { position: relative; height: 360px; overflow: hidden; margin-top: 8px; }
.meadow { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 360px; display: block; }
/* the bottom of the page turns back into plain, rougher paper */
.garden::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 55%; pointer-events: none; background: linear-gradient(rgba(232,233,222,0), rgba(232,233,222,.55) 55%, rgba(232,233,222,.85)), ${noise(".55", 3, ".22", 9, 260)}; -webkit-mask-image: linear-gradient(transparent, #000 60%); mask-image: linear-gradient(transparent, #000 60%); }
.f-credit { position: absolute; left: 0; right: 0; bottom: 16px; z-index: 1; }
.f-credit .wrap { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font: 400 12.5px/1.4 var(--mono); color: var(--ink); opacity: .75; }

@media (max-width: 820px) {
  .mast { padding: 40px 0 40px; }
  .mast .wrap { grid-template-columns: 1fr; gap: 8px; }
  .card { max-width: 420px; margin-right: 10px; }
  .tl { --gut: 0px; }
  .tl::before { left: 4px; }
  .tl-item { grid-template-columns: 10px minmax(0, 1fr); column-gap: 14px; }
  .tl-when { grid-column: 2; text-align: left; margin: 0 0 6px; }
  .tl-dot { grid-column: 1; grid-row: 1; margin-top: 4px; }
  .tl-item > .job { grid-column: 2; }
  .job h3 { padding-right: 0; }
  .logo { position: static; display: block; height: 24px; margin-bottom: 8px; }
  .skills { grid-template-columns: 1fr; }
  .f-row { grid-template-columns: 1fr; }
  .f-cols { gap: 40px; }
}
@media (max-width: 560px) {
  .lede { font-size: 17px; }
  h2 { font-size: 27px; }
  .shead .label { display: none; }
  .job { padding: 14px 16px; }
  .job h3 { font-size: 19.5px; }
  .card { max-width: none; }
  /* compact project cards: thumbnail on the left, text on the right */
  .projects { gap: 12px; }
  .proj { display: grid; grid-template-columns: 104px minmax(0, 1fr); align-items: start; }
  .proj figure { margin: 10px 0 10px 10px; aspect-ratio: 1 / 1; }
  .proj .body { padding: 9px 12px 12px; }
  .proj .meta { flex-wrap: wrap; }
  .proj h3 { font-size: 17px; }
  .proj p { font-size: 14px; }
  .garden { height: 240px; }
  .meadow { width: 960px; height: 240px; left: -30px; right: auto; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } .job:hover, .proj:hover, .card:hover, .proj:hover img { transform: none; } }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.name)}</title>
<meta name="description" content="${esc(c.name)}. ${esc(c.intro.split(". ")[0])}.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" href="favicon/favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
<link rel="manifest" href="favicon/site.webmanifest">
<meta name="theme-color" content="#5c7646">
<style>${css}</style>
</head>
<body data-stamp="${av && av.showStamp === false ? "off" : "on"}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 1.4" result="m"/><feComposite in="d" in2="m" operator="in"/></filter></svg>
<header class="mast">
  <div class="wrap">
    <div>
      <p class="label">${esc(c.role)}</p>
      <h1>${esc(c.name)}</h1>
      <p class="lede">${esc(c.intro)}</p>
      <ul class="links">${links.map((l) => `<li>${a(l)}</li>`).join("")}</ul>
    </div>
    ${card}
  </div>
</header>
<main>
  <section id="experience" class="wrap" aria-labelledby="h-exp">
    <div class="shead"><h2 id="h-exp">Experience</h2><span class="label">Work and education</span></div>
    <ol class="tl">${experience}</ol>
  </section>
  <section id="projects" class="wrap" aria-labelledby="h-proj">
    <div class="shead"><h2 id="h-proj">Projects</h2><span class="label">${c.projects.length} projects</span></div>
    <div class="projects">${projects}</div>
  </section>
  <section id="skills" class="wrap" aria-labelledby="h-skills">
    <div class="shead"><h2 id="h-skills">Skills and tools</h2></div>
    <dl class="skills">${skills}</dl>
  </section>
</main>
${footerHtml}
</body>
</html>
`;

const out = new URL("./dist/", import.meta.url);
if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });
cpSync(new URL("./public/", import.meta.url), out, { recursive: true });
writeFileSync(new URL("./index.html", out), html);
console.log("Built dist/index.html");
