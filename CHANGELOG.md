# Changelog

All notable changes to this package are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the major version is 0, the shape of a mark may change in a minor
release — the drawings are still settling. The component API will not.

## [Unreleased]

### Changed

- **`payslip` carries a currency symbol.** This mark went through a figure, a
  coin, a banknote and a pair of arrows before landing here, and the reason is
  worth stating: the document family all share one sheet outline, so the content
  is the only differentiator, and every currency-neutral option was either
  unreadable on its own or sat on top of `invoice`.

  Every other set solves this with a currency symbol — lucide ships
  `receipt-cent`, `receipt-euro`, `receipt-japanese-yen` and four more; Tabler's
  `report-money` is a clipboard with a `$`. The mark now does the same, reusing
  the `$` already drawn for `coin-dollar` rather than a new one.

  **This trades neutrality for legibility, deliberately.** The README's
  "currency-neutral by default" still holds for `coin`, which ships blank, but
  `payslip` no longer does: `dollar` covers HKD and SGD, and a Malaysian payslip
  is in ringgit. If that matters more than being read at a glance, the arrows
  version is in the history at `6a99fed`.

  The `$` is placed to sit entirely clear of the badge disc on both masters, so
  `payslip-pending` and `payslip-approved` keep the whole glyph and the knockout
  only trims the line beneath it. Nearest mark at 16px is `statement` at 68%.

## [0.4.0] — 2026-09-03

### Added

- **`compliance`** — a notched seal with a check. `shield` says protection, and
  most statutory schemes here are protection: a provident fund, an injury
  scheme. But a levy is an obligation, not a cover, and a nav item that heads
  the whole statutory section needs to say "required by law" rather than
  "protects you".

  Four marks were drawn for it. A gavel is a squiggle at 16px and says
  courtroom, not payroll. A rulebook collides with `ledger`, which is already a
  book. A checklist sits too close to `timesheet` and to the `ClipboardList`
  name products already map onto it. The seal was the only one legible at 16px
  and unused elsewhere in the set — nothing else is a notched rim.

  Its outer radius is the canonical large circle, and the 16-unit master carries
  seven notches rather than eight because the small master's stroke is a quarter
  heavier relative to its grid. It scores below every reported pair, including
  against `approved`, which is also a check.

### Changed

- **`payslip` drops the person and carries an amount instead.** The mark was a
  sheet with a figure on it, which said "someone's document" rather than
  "someone's pay". It is now a label line and a coin — the set's own money
  glyph — so every element on the sheet is a payslip element.

  The obvious version, replacing the figure with more ruled lines, was measured
  and rejected: it lands 81% similar to `invoice` at 16px, against 66% for the
  old mark, because the figure was the only thing keeping the two apart. The
  coin restores the distance (68% to `invoice`, 71% to `statement` — the same
  profile the mark had before) while using different ink from every other sheet
  in the family. `payslip-pending` and `payslip-approved` still read once the
  badge knockout takes the coin's lower-right.

- **`banknote` and `team` are taller.** Measured against the rest of the set,
  `banknote` was the clear outlier — 8.50u of ink height where the median 16-unit
  master is 13.75 — so next to any neighbour it read a size small. Its container
  goes from 7.2u to 9.8u tall (12u to 15u on the 24 master), with the roundel and
  the two edge ticks grown to match. `team` was in the short band with `employee`
  and `balance`; it now measures 13.00/19.50, level with `client`. Both stay
  inside the live area, clear the 0.4u gap guard, and add no confusable pair.

- **`absoluteStrokeWidth` now uses `vector-effect="non-scaling-stroke"`** in
  both runtimes instead of dividing the width by the render size in JS. The
  stroke attribute stays as requested and the browser holds it in device
  pixels after the viewBox transform. Mask paths carry the effect too, so a
  filled icon's knockouts stay as wide as the stroke they are cut for. Draw-on
  animation is unaffected: `pathLength="1"` runs on the normalised length.

### Fixed

- **`npm run confusability` parsed zero icons.** Its registry regex still
  required the `set:` field that the previous change removed, so it silently
  reported an empty set instead of failing loudly.

### Removed

- **The `core` / `extended` set.** Every icon is available and always was —
  the split was a curated starting list, and it kept costing a filter in the
  build, a toggle in the docs, a column in the snapshot and a paragraph in the
  README for a distinction no consumer needed to make. Gone: `set` from the
  manifest and `IconMeta`, `--set core` / `npm run icons:core` /
  `npm run build:core`, the docs-site toggle, the CI subset build.

## [0.3.0] — 2026-08-21

### Added

- **A `draft` modifier**, and `pay-run-draft` / `assignment-draft` with it.
  Draft was the one state the vocabulary could not say, so `payslip-draft` had
  been borrowing `pending` — but a draft is unsent and pending is sent and
  waiting, which are different rows in a list and different actions to take.

  The glyph is a pencil, drawn into the badge zone directly rather than inside
  a disc, the way `locked` and `recurring` already are. Its tip sits at the
  badge's diagonal extreme, so the weight it needed came from widening the body
  rather than lengthening it — growing it kept the tip 0.03 units from the
  knockout edge, against the 0.5 clear ring the disc modifiers hold.

  Which marks got the state came from the server rather than from guessing:
  `Draft` is a real status on `PayrollRun` and on `Assignment`, and there is no
  payslip status at all. The speculative `payslip-draft` concept is gone and
  `payroll-run-draft` and `assignment-draft` replace it. The backlog of
  concepts borrowing another mark drops from 13 to 12.

- **`social-insurance`, and `levy` from composition.** SOCSO, EIS, SDL and FWL
  were all borrowing the generic `shield`, which meant four different statutory
  schemes drew the same mark — and Malaysia, where SOCSO and EIS appear on the
  same payslip, lands in the second half of the year.

  `social-insurance` is a figure inside the shield: protection of a person. It
  derives its filled form from the outline, so it needed no drawn solid.

  `levy` needed no drawing at all. A levy is a statutory outflow, and `down`
  already means 扣除 / 支出, so `shield + down` says it — which is exactly the
  rule this repo tells everyone else to follow before adding a base. It scores
  87.0% against `pension-contribution` (`shield + up`), which is the same
  relationship `deduction` and `allowance` have on `coin` at 88.7%: same base,
  different badge, and the badge is the whole point.

  The statutory family now reads as one system — down is money out, up is money
  in, a figure inside is protection. Concepts borrowing another mark: 12 to 8.

- **`margin`** — two levels with an arrow between them, the spread. It had been
  borrowing `balance`, which is a pair of scales and means reconciliation.

  `billing-rate` deliberately did **not** get one. Three marks were drawn and
  all three failed on sight: money-over-time as a diagonal fraction renders as a
  literal `%`, which `tax-form` owns; as a stacked fraction it renders as `÷`
  and is mush at 16px; a price tag is legible but reads as *label* in software.
  Sharing `coin` beside a text label beats all three. "The difference between
  two amounts" has a shape; "amount per unit of time" does not.

  Concepts borrowing another mark: 8 to 7.

- **`npm run docs`**, which checks every figure the documentation states against
  the set itself — 19 counts and 2 lists, in CI and before publish.

  These had gone stale three times in one sitting: icon and base totals, the
  core count, how many bases refuse a badge, the derived/drawn split, the
  confusability pair count. A document that states a wrong number confidently is
  worse than one that states none, because the reader cannot tell.

  It reads the manifest and the icons directory rather than the build output, so
  it runs before anything is generated, and it never writes — it reports the
  file, the line, and the right value. A pattern that stops matching is a
  failure rather than a skip: a check that quietly matches nothing looks exactly
  like a check that passes, which is how a stale number survives a green build.

  It found three on its first run, and the `%`-vs-`÷` lesson repeated in
  miniature — the pair count had been 1,830 for a set that now has 1,891.

### Changed

- **Renamed to `hr-icons`.** The set was never payroll-only — it covers time and
  attendance, staffing, statutory schemes across three jurisdictions and
  billing. It also no longer publishes under the `@octomate` scope; this is a
  personal project.

  `@octomate/payroll-icons` is deprecated and points here. Its published
  versions keep working: nothing is unpublished, and the marks are identical.
  The Angular component follows the name — `PayrollIconComponent` is now
  `HrIconComponent` and its selector `pi-icon` is now `hr-icon`.

## [0.2.0] — 2026-08-17

### Added

- **A `staffing` group, with `client` and `assignment`.** Contract-payroll and
  staffing products place a consultant at a client for a period, and the set had
  no mark for either end of that. `client` is an office block, deliberately
  unlike `bank`'s pediment and columns; `assignment` is a case, a silhouette
  nothing else in the set uses.

  `job-order` is **not** a third base — a job order is a placement that has not
  been filled, which is `assignment` + the existing `pending` modifier. The same
  composition gives `assignment-approved` and `assignment-exception`.

  `client` is marked `composable: false`: its lower wing occupies the modifier
  zone, so badging it destroys the mark. `assignment` composes cleanly.

- **An Angular entry point.** `hr-icons/angular` exports a
  `HrIconComponent` and every icon as an `IconDefinition`. The geometry
  moved into a framework-free core that both runtimes consume, so a mark cannot
  drift between React and Angular.

- **A minimum-gap guard in the build.** Strokes that come within 0.4 units of
  each other without meeting now fail the build, naming the file, the stroke
  pair and the coordinate. Geometry is sampled in pure JS (`scripts/gaps.mjs`)
  so the check runs in the normal build rather than needing a rasteriser, and it
  compares subpaths rather than whole `<path>` elements — separate marks inside
  one element merge just as readily.

  The 0.4 comes from the badge geometry, not from taste: a glyph inside the
  4.25-unit modifier disc cannot clear more than about 0.45, so anything tighter
  is a slip rather than a constraint the grid imposed.

- **A concept table**, at `hr-icons/concepts`. 66 ideas, each
  pinned to exactly one mark, so two screens showing the same thing cannot show
  it differently. `iconFor(term)` resolves a concept name, its Chinese label or
  any synonym, ignoring case and separators — `"job order"`, `"job-order"`,
  `"requisition"` and `"職缺"` all land on `job-order`. The build fails if a
  concept names an icon that does not exist, or if a term is claimed twice: a
  word that resolves to two marks sends whoever typed it back to guessing.

  It covers the statutory vocabulary of all three jurisdictions — MPF and IR56
  for Hong Kong, CPF, SDL, FWL and IR8A for Singapore, EPF, SOCSO, EIS and PCB
  for Malaysia — and the same idea in three countries resolves to one mark.

  `approximated` lists the concepts still borrowing the nearest mark instead of
  owning one, and the build prints the count. It is 13 today, which is the
  drawing backlog stated as data rather than as a paragraph someone has to
  remember to update.

- **A shape canon, and `npm run shapes` to audit against it.** Recurring shapes
  now have one value each: the large circle is 8.2 at 24 and 5.5 at 16, a
  container corner 2.5 and 1.5, a small element corner 1.5 and 1.0. The script
  prints every radius in use grouped by the job it does. It reports rather than
  fails — `ledger`'s squarer page edge is deliberate, and a gate that cried wolf
  about it would train everyone to ignore the gate.

- `npm run confusability`, which rasterises every icon at 16px and scores each
  pair on shared ink, separating pairs that are alike by design from marks that
  genuinely collide.
- A test suite. 47 tests covering the runtime's behaviour — size and stroke
  resolution, optical master selection, the filled variant and its fallback,
  the accessibility contract, mask-id uniqueness — the path sampler behind the
  gap guard, and a snapshot of every path array, which is the only thing that
  catches a drawing changing when it should not have.

### Changed

- **Redrawn to clear the new gap threshold.** Fourteen masters had strokes a
  fraction of a unit apart, which fills in and reads as one thick smudge at the
  sizes these icons are used:

  - `exception` at 16 had 0.11 units between the stem and the dot, so it drew a
    plain vertical line rather than an exclamation mark.
  - `tax-form` at 16 had 0.04 between a counter and the slash. The percent could
    not be given room beside the container's rule, so the small master now drops
    the rule — which is what a separate optical master is for.
  - `timesheet` at 16 had 0.05 between the clock and the box floor; the clock
    did not fit and is now smaller.
  - `team` at both sizes had a hairline between head and shoulders, the worst of
    both worlds — neither a clean join nor a clean separation.
  - `pay-run`, `approved`, and the `dollar`, `yen`, `rupiah`, `baht`, `peso` and
    `dong` coins were adjusted for the same reason.

  No mark changed silhouette; the geometry snapshot records the exact paths.

- **Recurring shapes brought onto the canon.** `clock` (8.5) and `pay-run` (8.4)
  now use the large-circle radius of 8.2 that the ten coins already shared —
  twelve marks had carried three radii for what the eye reads as one circle.
  `documents`, `banknote`, `assignment` and `ledger`'s spine moved onto the
  container-corner radius. Every bounding box is unchanged; only the corners
  and the two circles moved, by fractions of a unit.

- TypeScript held at 5.9. Angular's compiler-cli pins `typescript` below 6.1,
  so shipping an Angular entry point means tracking the TypeScript the Angular
  toolchain supports. Nothing is lost: TypeScript 7 emitted byte-identical
  `.js` and `.d.ts`.
- Toolchain brought current: Vite 8, Vitest 4, plugin-react 6, and the GitHub
  Actions moved up a major each, with CI on Node 24. The published output is
  unaffected — the emitted `.js` and `.d.ts` are byte for byte what TypeScript
  5.9 produced; only the source maps differ, since those encode the compiler.
- `contract` redrawn at 16 units: one rule instead of two, and a larger
  signature. It scored 84.9% similar to `invoice` at 16px, the closest
  cross-base pair, and that similarity propagated to every composed mark built
  on either. Now 75.6%, and the previous worst pair overall —
  `credit-note` against `contract-signed` at 86.2% — is gone.
- **Breaking (registry shape).** `tier: "free" | "pro"` on registry entries is
  now `set: "core" | "extended"`. The old name implied a paywall that does not
  exist — everything ships under one MIT licence. The new name describes what
  the field actually does: curate a starting subset. `npm run icons:free` is
  now `npm run icons:core`.
- `homepage` now points at the documentation site rather than the README.

## [0.1.0] — 2026-08-09

First preview release.

### Added

- **54 icons** for payroll, time and attendance, statutory contributions,
  billing and payments, built from 21 bases combined with 9 modifiers.
- **Two optical sizes.** A 24-unit master and a separately drawn 16-unit
  master, selected automatically at 18px and below. The small master drops the
  modifier ring, which fills in solid below that size, and carries fewer detail
  lines.
- **Two weights.** `variant="filled"` for selected and tab-bar states, on every
  mark at both sizes. 34 are derived from the outline by masking; 20 are drawn
  solid masters for shapes the derivation cannot reach.
- **Nine currency coins**, named by symbol rather than ISO code, each carrying
  the `covers` list of codes it legitimately stands for.
- **Draw-on animation**, opt-in via `animate.css`. Every path carries
  `pathLength="1"`, so one rule times the whole library.
- **Framework-neutral exports** — raw path data, `toSvgString()`, and optimised
  `.svg` files alongside the React components.
- **Figma import bundle** via `npm run figma`: 212 SVGs plus a manifest naming
  each component and its size/style variant properties.

### Notes

- `coin` ships without a currency symbol so one set serves every market.
- Icons are decorative by default; passing `aria-label` switches them to
  `role="img"`.
- Two system rules are enforced at build time rather than documented: a
  display-only base cannot be badged, and a modifier cannot repeat a glyph its
  base already contains.
