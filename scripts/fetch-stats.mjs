#!/usr/bin/env node
/**
 * Build-time stats injector.
 *
 * Fetches live project metrics (GitHub stars/forks/contributors, recent PyPI
 * downloads) and rewrites the matching `data-stat="..."` anchors inside the
 * ALREADY-BUILT `dist/index.html`. It never touches the source `index.html`,
 * and it is best-effort: any network/parse failure falls back to the committed
 * defaults so a deploy can never be broken by a flaky API.
 *
 * Runs after `npm run build`, on the CI runner (see .github/workflows/static.yml),
 * authenticated with GITHUB_TOKEN to avoid the 60 req/hr unauthenticated limit.
 * Node 20+ (global fetch, no dependencies).
 */
import { readFile, writeFile } from "node:fs/promises";

const REPO = "RocketPy-Team/RocketPy";
const HTML = "dist/index.html";

/* Committed fallbacks — kept in sync with the defaults hard-coded in index.html
   so the page still reads sensibly if every request below fails. `downloads`
   is a rolling ~180-day figure (see fetchDownloads), not the all-time total. */
const stats = { stars: 1021, forks: 268, contributors: 75, downloads: 25000 };

const gh = (path) =>
  fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "rocketpy-site-build",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

/** Compact human formatting: 1021 -> "1,021", 173210 -> "173k+". */
const comma = (n) => n.toLocaleString("en-US");
const kplus = (n) =>
  n >= 1000 ? Math.floor(n / 1000).toLocaleString("en-US") + "k+" : String(n);

/** Total contributors via the Link header's last-page number (per_page=1). */
async function fetchContributors() {
  const res = await gh(`repos/${REPO}/contributors?per_page=1&anon=true`);
  if (!res.ok) throw new Error(`contributors HTTP ${res.status}`);
  const link = res.headers.get("link") || "";
  const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (m) return Number(m[1]);
  // No pagination -> everyone fit on one page; count the array.
  const arr = await res.json();
  return Array.isArray(arr) ? arr.length : null;
}

/** Rolling PyPI downloads over the window pypistats exposes (~180 days) =
    sum of the non-mirror daily series. Not the all-time total (pypistats
    only keeps ~180 days of history). */
async function fetchDownloads() {
  const res = await fetch(
    "https://pypistats.org/api/packages/rocketpy/overall?mirrors=false",
    { headers: { "User-Agent": "rocketpy-site-build" } },
  );
  if (!res.ok) throw new Error(`pypistats HTTP ${res.status}`);
  const json = await res.json();
  const rows = json?.data;
  if (!Array.isArray(rows) || !rows.length) throw new Error("pypistats empty");
  return rows.reduce((sum, r) => sum + (r.downloads || 0), 0);
}

/* --- gather (each source isolated; one failure keeps the others + fallback) --- */
try {
  const res = await gh(`repos/${REPO}`);
  if (!res.ok) throw new Error(`repo HTTP ${res.status}`);
  const repo = await res.json();
  if (repo.stargazers_count) stats.stars = repo.stargazers_count;
  if (repo.forks_count) stats.forks = repo.forks_count;
} catch (e) {
  console.warn("stats: github repo ->", e.message);
}

try {
  const c = await fetchContributors();
  if (c) stats.contributors = c;
} catch (e) {
  console.warn("stats: contributors ->", e.message);
}

try {
  const d = await fetchDownloads();
  if (d) stats.downloads = d;
} catch (e) {
  console.warn("stats: pypi downloads ->", e.message);
}

/* --- inject into dist/index.html on the stable data-stat anchors --- */
const values = {
  stars: comma(stats.stars),
  forks: comma(stats.forks),
  contributors: stats.contributors + "+", // shown as a raw "N+", e.g. "75+"
  downloads: kplus(stats.downloads),
};

let html;
try {
  html = await readFile(HTML, "utf8");
} catch (e) {
  console.warn(`stats: cannot read ${HTML} (${e.message}); skipping injection`);
  process.exit(0);
}

let hits = 0;
for (const [key, value] of Object.entries(values)) {
  const re = new RegExp(`(<[^>]*\\bdata-stat="${key}"[^>]*>)([^<]*)(</)`, "g");
  html = html.replace(re, (_, open, __, close) => {
    hits += 1;
    return open + value + close;
  });
}

if (hits === 0) {
  console.warn(
    "stats: WARNING — no data-stat anchors matched; leaving committed defaults",
  );
} else {
  await writeFile(HTML, html);
}

console.log(`stats: injected ${hits} value(s)`, values);
