# Private schematic model preparation

[IOP-211](../planning/items/IOP-211-locator-models-and-access.md) refines the supplied
source interpretation: circular diagonal symbols are motors; narrow cross-conveyor
bars are candidate photoelectric sensors. The private source legend and the owner's
explicit interpretation supply this classification. Neither snapshot color nor an
alarm description supplies current equipment health, a surveyed position or a
registered physical identity.

The source-specific local adapter uses installed macOS AppKit/Swift to decode PNG
pixels and draw inspection overlays. Its bounded JavaScript analysis and synthetic
tests need no added image dependency. It is separate from the portable API/browser
runtime and does not execute database operations or call a plant/provider.

```sh
node scripts/local/locator-schematic-models.cjs \
  --directory .local-platform/locator/organization-id/site-id \
  --output .local-platform/locator/organization-id/site-id/model-candidates.json \
  --inspection .local-platform/locator-inspection/review-001
```

Use explicit real installation scope IDs. Inputs are the existing private
`manifest.json`, content-addressed PNGs and optional `traces.json`. The command
checks scope, finite reference/byte/pixel limits, regular files, original SHA-256
and dimensions before analysis and again before publishing candidates. It preserves
the original PNGs and previous traces. An existing different output is rejected;
an identical candidate file is idempotent. Choose a new inspection directory for
each run. Native intermediates are temporary and removed; private JSON/PNG outputs
have mode 0600 and newly created directories have mode 0700.

## Candidate meaning and review

Each area receives one candidate scene with the exact old `previousComponents`
baseline, proposed `components` and source evidence. Component identities derive
deterministically from original SHA-256, kind and pixel box. Sequential labels are
provisional display labels, not fabricated equipment identifiers. Every generated
component has normalized image-local coordinates, `elevation: null`, empty
`assetId` and `verification: provisional`. Notes retain original SHA, pixel bounds,
algorithm version and limitations. Existing manually traced conveyor/curve topology
and readable scanner references are retained instead of replacing them with poorer
automatic straight-line segmentation.

Analysis recognizes circular dark motor boundaries with a solid diagonal half-fill,
paired axis-aligned/45-degree conveyor rails and thin axis-aligned cross-belt bars
near motors. Green status squares, hollow emergency-stop circles inside square
frames, hatched initiator circles, white HMI buttons and external rectangular
modules do not satisfy those symbol rules.
Overlays mark motor circles in cyan, candidate photoelectric bars in orange and
detected straight conveyor runs in blue. Review source families, dense layouts,
passive buffers and exceptional diagrams against their original images. Detection
counts are provisional coverage, never an equipment inventory. Small/occluded or
diagonal sensor bars, other conveyor angles and curves can remain incomplete.
Flow direction is not inferred. A view with no safe component
candidate remains explicitly `manual-trace-required`.
Separate views or sectional illustrations may repeat one physical device. These
are independent schematic symbol instances until the Administrator explicitly
links them; the tool never creates or duplicates registered Assets.

Candidate output is bounded to 250 scenes, 1,000 components and 1 MiB per scene,
with a 32 MiB file ceiling. It is independent of the original small `traces.json`
bootstrap budget. Private source diagrams, derived geometry and overlays stay
outside Git and the browser public bundle.

## Authorized upgrade

Preparation never changes an actual scene. The receiving-owned Administrator
operation applies one reference through normal scoped scene/revision authority.
It may upgrade an untouched empty scene or one whose complete components still
equal `previousComponents`; conflicts or operator-modified, linked or surveyed
data must be retained and reported for manual review. A repeated identical model
is a no-op. Canonical linking and any physical verification remain deliberate
Administrator decisions after source review.

Run the source-tool regression independently with:

```sh
node node_modules/jest/bin/jest.js --config scripts/jest.config.cjs \
  --runInBand --testPathPatterns locator-schematic-models
```

The execution plan records actual private coverage, visual checks and remaining
uncertainty; synthetic recognition alone does not establish real-image accuracy.
