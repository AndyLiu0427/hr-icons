/**
 * Is it worth moving the 16-unit masters onto the pixel grid?
 *
 * Atlassian's 2024 icon system aligns stroke edges to the pixel grid at 16px;
 * Cursor's team deliberately does not, because one icon renders at 12, 14, 16
 * and 20px and snapping only helps one of them. Both are credible, so this
 * measures rather than picks a side.
 *
 * Every 16-unit master is rendered at 16 CSS px through Chromium at device
 * scale 1 and 2, in four variants:
 *   asis 1.25   coordinates as authored
 *   snap 1.25   axis-aligned segments moved so ONE stroke edge lands on a pixel
 *               boundary — both cannot, 1.25 is not an integer
 *   snap 1.0    stroke 1.0 on x.5, so BOTH edges align: the ceiling
 *   snap 1.5    stroke 1.5 on x.25/x.75, one edge aligned (Atlassian's weight)
 * with lucide at 16px as the comparator the adopting app ships today.
 *
 * Score: soft = sum over pixels of min(alpha, 1-alpha), ink = sum of alpha.
 * softRatio = soft/ink, so 0 is perfectly crisp and a stroke straddling two
 * pixel rows scores high. Dividing by ink keeps stroke weights comparable.
 *
 * The snapper is an instrument, not a proposal: it moves segments mechanically
 * and visibly deforms a few marks (pay-run loses its play triangle), so the
 * gain it reports is an upper bound on what careful redrawing would buy.
 *
 *   node scripts/snapping.mjs [outDir]            measure
 *   node scripts/snapping.mjs [outDir] --sheets   also write contact sheets
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findTightGaps } from "./gaps.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : ".";
const SHEETS = process.argv.includes("--sheets");

/* ------------------------------------------------------------ path snapper */
const NUM = /-?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y;
/** Absolute command list; masters only use M L H V C A Z (gaps.mjs guarantees). */
function parse(d) {
  const cmds = [];
  let i = 0,
    cx = 0,
    cy = 0,
    sx = 0,
    sy = 0,
    cmd = null;
  const sep = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  const num = () => {
    sep();
    NUM.lastIndex = i;
    const m = NUM.exec(d);
    if (!m || m.index !== i) throw new Error(`bad number at ${i} in ${d}`);
    i = NUM.lastIndex;
    return Number(m[0]);
  };
  const flag = () => {
    sep();
    const c = d[i++];
    return c === "1" ? 1 : 0;
  };
  const peekNum = () => {
    sep();
    NUM.lastIndex = i;
    const m = NUM.exec(d);
    return m && m.index === i;
  };
  while (i < d.length) {
    sep();
    if (i >= d.length) break;
    if (/[MLHVCAZmlhvcaz]/.test(d[i])) cmd = d[i++];
    else if (!peekNum()) throw new Error(`unexpected '${d[i]}' at ${i}`);
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === "Z") {
      cmds.push({ c: "Z", x: sx, y: sy });
      cx = sx;
      cy = sy;
      continue;
    }
    if (C === "M") {
      let x = num(),
        y = num();
      if (rel) {
        x += cx;
        y += cy;
      }
      cmds.push({ c: "M", x, y });
      cx = sx = x;
      cy = sy = y;
      cmd = rel ? "l" : "L";
      continue;
    }
    if (C === "L") {
      let x = num(),
        y = num();
      if (rel) {
        x += cx;
        y += cy;
      }
      cmds.push({ c: "L", x, y });
      cx = x;
      cy = y;
      continue;
    }
    if (C === "H") {
      let x = num();
      if (rel) x += cx;
      cmds.push({ c: "L", x, y: cy });
      cx = x;
      continue;
    }
    if (C === "V") {
      let y = num();
      if (rel) y += cy;
      cmds.push({ c: "L", x: cx, y });
      cy = y;
      continue;
    }
    if (C === "C") {
      let x1 = num(),
        y1 = num(),
        x2 = num(),
        y2 = num(),
        x = num(),
        y = num();
      if (rel) {
        x1 += cx;
        y1 += cy;
        x2 += cx;
        y2 += cy;
        x += cx;
        y += cy;
      }
      cmds.push({ c: "C", x1, y1, x2, y2, x, y });
      cx = x;
      cy = y;
      continue;
    }
    if (C === "A") {
      const rx = num(),
        ry = num(),
        rot = num(),
        fA = flag(),
        fS = flag();
      let x = num(),
        y = num();
      if (rel) {
        x += cx;
        y += cy;
      }
      cmds.push({ c: "A", rx, ry, rot, fA, fS, x, y });
      cx = x;
      cy = y;
    }
  }
  return cmds;
}
const f = (n) => String(Math.round(n * 1000) / 1000);
function emit(cmds) {
  return cmds
    .map((k) =>
      k.c === "Z"
        ? "Z"
        : k.c === "C"
          ? `C${f(k.x1)} ${f(k.y1)} ${f(k.x2)} ${f(k.y2)} ${f(k.x)} ${f(k.y)}`
          : k.c === "A"
            ? `A${f(k.rx)} ${f(k.ry)} ${f(k.rot)} ${k.fA} ${k.fS} ${f(k.x)} ${f(k.y)}`
            : `${k.c}${f(k.x)} ${f(k.y)}`,
    )
    .join("");
}
/** Nearest value whose fractional part is in `fracs`. */
const toLattice = (v, fracs) => {
  let best = v,
    dist = Infinity;
  for (const fr of fracs)
    for (const k of [Math.floor(v) - 1, Math.floor(v), Math.floor(v) + 1]) {
      const cand = k + fr,
        dd = Math.abs(cand - v);
      if (dd < dist - 1e-9) {
        dist = dd;
        best = cand;
      }
    }
  return best;
};
/** Move every axis-aligned straight segment so the stroke's edge lands on a pixel boundary. */
function snap(d, width) {
  const h = (width / 2) % 1;
  const fracs = [...new Set([h, (1 - h) % 1])];
  const cmds = parse(d);
  const origM = cmds.map((k) => [k.x, k.y]);
  const origEnds = cmds.map((k) => [k.x, k.y]);
  snap.shifts = snap.shifts ?? [];
  // start point of each command = end of previous (or subpath start after Z)
  const setEnd = (i, key, v) => {
    const k = cmds[i];
    if (k.c === "M" || k.c === "L" || k.c === "C" || k.c === "A") k[key] = v;
  };
  for (let i = 0; i < cmds.length; i++) {
    const k = cmds[i];
    if (k.c !== "L" && k.c !== "Z") continue;
    const prev = i > 0 ? cmds[i - 1] : { x: 0, y: 0 };
    const [x0, y0] = [prev.x, prev.y];
    if (k.c === "Z") {
      const m = cmds[findM(cmds, i)];
      k.x = m.x;
      k.y = m.y;
    } // Z closes to the *current* start, which may already have moved
    if (Math.abs(k.y - y0) < 1e-6 && Math.abs(k.x - x0) > 1e-6) {
      // horizontal
      const y = toLattice(k.y, fracs);
      snap.shifts.push(Math.abs(y - k.y));
      if (k.c === "L") k.y = y;
      else {
        const m = findM(cmds, i);
        cmds[m].y = y;
      }
      if (i > 0) setEnd(i - 1, "y", y);
    } else if (Math.abs(k.x - x0) < 1e-6 && Math.abs(k.y - y0) > 1e-6) {
      // vertical
      const x = toLattice(k.x, fracs);
      snap.shifts.push(Math.abs(x - k.x));
      if (k.c === "L") k.x = x;
      else {
        const m = findM(cmds, i);
        cmds[m].x = x;
      }
      if (i > 0) setEnd(i - 1, "x", x);
    }
  }
  /*
   * Moving a subpath's start point orphans whatever closes back onto it: the
   * final arc still ends at the old coordinate, leaving a hairline break. Pull
   * every closing endpoint back onto its (possibly moved) M.
   */
  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i].c !== "M") continue;
    let end = i;
    while (end + 1 < cmds.length && cmds[end + 1].c !== "M") end++;
    const m = cmds[i];
    const closes =
      cmds[end].c === "Z" ||
      (Math.abs(origEnds[end][0] - origM[i][0]) < 1e-6 &&
        Math.abs(origEnds[end][1] - origM[i][1]) < 1e-6);
    if (!closes) continue;
    const last = cmds[end].c === "Z" ? cmds[end - 1] : cmds[end];
    if (last && last.c !== "Z") {
      last.x = m.x;
      last.y = m.y;
    }
    if (cmds[end].c === "Z") {
      cmds[end].x = m.x;
      cmds[end].y = m.y;
    }
  }
  return emit(cmds);
}
const findM = (cmds, i) => {
  for (let j = i; j >= 0; j--) if (cmds[j].c === "M") return j;
  return 0;
};

/* ------------------------------------------------------------- build svgs */
const readDir = (dir) =>
  readdirSync(join(ROOT, "icons", dir))
    .filter((n) => n.endsWith(".svg"))
    .map((n) => ({
      name: n.replace(/\.svg$/, ""),
      svg: readFileSync(join(ROOT, "icons", dir, n), "utf8"),
    }));
const masters = [...readDir("bases-16"), ...readDir("currency-16")];
const nonPath = masters
  .filter((m) => /<(circle|rect|line|polyline|polygon|ellipse)\b/.test(m.svg))
  .map((m) => m.name);
if (nonPath.length)
  console.warn(`  note: non-path elements left unsnapped in: ${nonPath.join(", ")}`);

const withStroke = (svg, w) =>
  svg.replace(/stroke-width="[^"]*"/, `stroke-width="${w}"`).replace("<svg ", '<svg color="#000" ');
const snapped = (svg, w) =>
  withStroke(svg, w).replace(/ d="([^"]*)"/g, (_, d) => ` d="${snap(d, w)}"`);

const variants = [];
for (const m of masters) {
  variants.push({ set: "hr", variant: "asis 1.25", name: m.name, svg: withStroke(m.svg, 1.25) });
  variants.push({ set: "hr", variant: "snap 1.25", name: m.name, svg: snapped(m.svg, 1.25) });
  variants.push({ set: "hr", variant: "snap 1.0", name: m.name, svg: snapped(m.svg, 1.0) });
  variants.push({ set: "hr", variant: "snap 1.5", name: m.name, svg: snapped(m.svg, 1.5) });
}
const lucidePath = join(OUT, "lucide.json");
const lucideText = existsSync(lucidePath) ? readFileSync(lucidePath, "utf8").trim() : "";
if (lucideText.startsWith("{")) {
  const lucide = JSON.parse(lucideText);
  const el = ([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ")}/>`;
  for (const [name, nodes] of Object.entries(lucide))
    for (const w of [1.875, 2]) {
      variants.push({
        set: "lucide",
        variant: `lucide ${w}`,
        name,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" color="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${nodes.map(el).join("")}</svg>`,
      });
    }
} else console.warn("  note: no lucide.json — comparator skipped");

/* --------------------------------------------------------------- rasterise */
const { chromium } = await import("playwright").catch(() => ({ chromium: null }));
if (!chromium) {
  console.error(
    "\n✗ needs playwright to rasterise: npm i -D playwright && npx playwright install chromium\n",
  );
  process.exit(1);
}
const browser = await chromium.launch();
const page = await browser.newPage();
const scored = await page.evaluate(
  async ([list, dprs]) => {
    const raster = async (svg, N) => {
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace("<svg ", `<svg width="${N}" height="${N}" `))}`;
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const c = document.createElement("canvas");
      c.width = N;
      c.height = N;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      const d = ctx.getImageData(0, 0, N, N).data;
      let ink = 0,
        soft = 0,
        on = 0,
        partial = 0;
      for (let i = 0; i < N * N; i++) {
        const a = d[i * 4 + 3] / 255;
        ink += a;
        soft += Math.min(a, 1 - a);
        if (a > 0) on++;
        if (a > 0.02 && a < 0.98) partial++;
      }
      return {
        ink,
        soft,
        on,
        partial,
        softRatio: ink ? soft / ink : 0,
        partialShare: on ? partial / on : 0,
      };
    };
    const out = [];
    for (const v of list)
      for (const dpr of dprs)
        out.push({ ...v, svg: undefined, dpr, ...(await raster(v.svg, 16 * dpr)) });
    return out;
  },
  [variants, [1, 2]],
);
await browser.close();

/* ------------------------------------------------------------------ report */
writeFileSync(join(OUT, "snapping.json"), JSON.stringify(scored, null, 1));
const groups = {};
for (const r of scored) (groups[`${r.variant} @${r.dpr}x`] ??= []).push(r);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(
  "\nvariant           n   softRatio   partial-share   (mean over icons; lower = crisper)",
);
for (const [k, rs] of Object.entries(groups)) {
  console.log(
    `${k.padEnd(17)} ${String(rs.length).padStart(2)}   ${mean(rs.map((r) => r.softRatio)).toFixed(3)}       ${mean(rs.map((r) => r.partialShare)).toFixed(3)}`,
  );
}
const gain = (a, b, dpr) => {
  const A = groups[`${a} @${dpr}x`],
    B = groups[`${b} @${dpr}x`];
  return mean(A.map((r, i) => r.softRatio - B[i].softRatio));
};
console.log(
  `\ngain from snapping (asis − snap 1.25):  @1x ${gain("asis 1.25", "snap 1.25", 1).toFixed(3)}   @2x ${gain("asis 1.25", "snap 1.25", 2).toFixed(3)}`,
);
console.log(
  `ceiling (asis − snap 1.0):              @1x ${gain("asis 1.25", "snap 1.0", 1).toFixed(3)}   @2x ${gain("asis 1.25", "snap 1.0", 2).toFixed(3)}`,
);
/*
 * The gain has to be paid for. Snapping moves segments, and the masters are
 * drawn to a 0.4-unit minimum gap between stroke edges — the distance below
 * which two strokes stop reading as two. Anything the snapper pushes under
 * that would have to be redrawn, not just nudged.
 */
const broke = [];
snap.shifts = [];
for (const m of masters) {
  const ds = [...m.svg.matchAll(/ d="([^"]*)"/g)].map((x) => x[1]);
  const before = findTightGaps(ds, { strokeWidth: 1.25, minGap: 0.4, label: m.name });
  const after = findTightGaps(
    ds.map((d) => snap(d, 1.25)),
    { strokeWidth: 1.25, minGap: 0.4, label: m.name },
  );
  if (after.length && !before.length)
    broke.push(`${m.name} ${after.map((g) => g.gap.toFixed(2)).join(",")}`);
}
const moves = snap.shifts.filter((x) => x > 1e-6);
console.log(
  `\ncost of snapping: ${moves.length} segments move, mean ${(moves.reduce((a, b) => a + b, 0) / moves.length).toFixed(3)}u, max ${Math.max(...moves).toFixed(3)}u`,
);
console.log(
  `  masters pushed under the 0.4u gap guard: ${broke.length}/${masters.length}${broke.length ? ` — ${broke.join("; ")}` : ""}`,
);

const worst = groups["asis 1.25 @1x"]
  .slice()
  .sort((a, b) => b.softRatio - a.softRatio)
  .slice(0, 5)
  .map((r) => `${r.name} ${r.softRatio.toFixed(2)}`);
console.log(`\nsoftest as-is @1x: ${worst.join(", ")}`);

/* ------------------------------------------------------------ contact sheet */
if (SHEETS) {
  const Z = 6; /* upscale so one device pixel reads as a 6px block */
  const cols = ["asis 1.25", "snap 1.25", "snap 1.0", "snap 1.5"];
  const byIcon = masters.map((m) => ({
    name: m.name,
    cells: [
      withStroke(m.svg, 1.25),
      snapped(m.svg, 1.25),
      snapped(m.svg, 1.0),
      snapped(m.svg, 1.5),
    ],
  }));
  const html = (
    dpr,
  ) => `<!doctype html><style>body{margin:8px;font:11px monospace;background:#fff}table{border-collapse:collapse}td{padding:2px 6px;vertical-align:middle}th{font-weight:normal;color:#666}canvas{image-rendering:pixelated;display:block;background:#fff;outline:1px solid #ddd}</style>
<b>16 CSS px @${dpr}x, each device pixel shown ${Z}x</b>\n<script>const DPR=${dpr},ZOOM=${Z};</script>
<table><tr><th></th>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
${byIcon.map((r) => `<tr><td>${r.name}</td>${r.cells.map((s) => `<td><canvas data-svg="${encodeURIComponent(s)}"></canvas></td>`).join("")}</tr>`).join("\n")}</table>
<script>
(async () => {
  const N = 16 * DPR, Z = ZOOM;
  for (const c of document.querySelectorAll("canvas")) {
    const svg = decodeURIComponent(c.dataset.svg).replace("<svg ", '<svg width="' + N + '" height="' + N + '" ');
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    c.width = N; c.height = N; c.style.width = N * Z + "px"; c.style.height = N * Z + "px";
    c.getContext("2d").drawImage(img, 0, 0, N, N);
  }
  document.title = "done";
})();
</script>`;
  const b2 = await chromium.launch();
  for (const dpr of [1, 2]) {
    const page = await b2.newPage({
      viewport: { width: 4 * (16 * dpr * Z + 14) + 160, height: 900 },
    });
    await page.setContent(html(dpr));
    await page.waitForFunction(() => document.title === "done");
    const rows = await page.$$eval("tr", (trs) =>
      trs.map((t) => {
        const r = t.getBoundingClientRect();
        return [r.top, r.bottom];
      }),
    );
    const W = await page.evaluate(
      () => document.querySelector("table").getBoundingClientRect().right + 8,
    );
    for (let i = 1, part = 1; i < rows.length; i += 6, part++) {
      const clip = {
        x: 0,
        y: rows[i][0],
        width: W,
        height: rows[Math.min(i + 5, rows.length - 1)][1] - rows[i][0],
      };
      await page.screenshot({
        path: join(OUT, `snapping-${dpr}x-p${String(part).padStart(2, "0")}.png`),
        clip,
        fullPage: true,
      });
    }
    await page.close();
  }
  await b2.close();
  console.log(`\ncontact sheets written to ${OUT}`);
}
