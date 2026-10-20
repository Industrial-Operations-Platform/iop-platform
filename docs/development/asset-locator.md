# Asset Locator

[IOP-206](../planning/items/IOP-206-3d-asset-locator.md) delivers editable 3D schematic
scenes under [ADR-0037](../architecture/adr/ADR-0037-operational-completion.md).
Locator owns scene/placement revisions; Assets owns canonical identities and aliases.
Administrator, Team Leader and Task Force require current scoped `locator.read`
grants and their current permitted profile. Only a current Administrator with
`locator.manage` can configure scenes; an obsolete management grant does not give
Team Leader or Task Force configuration access. Technician access remains
denied even if an obsolete Locator assignment survives.

## Private reference import

Use Python's standard library; no drawing decoder or dependency installation is needed:

```sh
python3 scripts/local/locator-import.py /path/to/private-reference.zip \
  --organization example-org --site example-site \
  --root .local-platform/locator
```

The importer admits at most 250 PNGs, 4 MiB per image, 64 MiB uncompressed in total
and 16,777,216 pixels per image. Content-addressed filenames prevent archive path
traversal. It preserves original source filenames, image dimensions, hashes and
import time in a scope-specific private manifest. Images and traced customer
geometry remain under ignored `.local-platform/locator/<organization>/<site>/`;
never put them in `apps/web/public`, fixtures or Git.

Native composition sets `referenceRoot` to that private root. Container composition
uses `IOP_LOCATOR_REFERENCE_ROOT` and a private read-only runtime volume, retaining
private host permissions. PNG routes require a current Administrator with the
scoped `locator.manage` grant and return
`private, no-store`; hash/dimension checks reject tampered files and symbolic links.
The manifest's organization/site must exactly match the configured receiving scope.

Open Asset Locator, select **Configure scenes**, and use
**Initialize reference and example scenes**. Synchronization
creates durable scene metadata for each schematic plus a synthetic component example.
It is idempotent and never overwrites edited scenes. Legend references stay in the
private catalog and are not presented as physical area scenes.

An optional private `traces.json` file uses this structure:

```json
{"version":1,"organizationId":"example-org","siteId":"example-site","scenes":[
  {"referenceId":"<PNG SHA-256>","components":["<validated component objects>"]}
]}
```

Each actual component object follows the Locator API component schema. Imported
traces must have empty `assetId`, `verification: "provisional"` and
`elevation: null`; the adapter rejects automatic identity assignment or claimed
surveyed heights. Missing traces are valid and produce empty editable reference
scenes. The owner-supplied reference installation has 72 PNGs (71 equipment views
and a legend), with 81 hand-traced provisional components across three views after the IOP-219
curve correction.
Source-specific trace data is private and not reproducible from repository fixtures.

## Editing and evidence

Asset Locator opens in the operational view. Area cards load no image previews or
whole-plant graphics context; opening an area loads only its 3D components.
Viewer context includes reference dimensions to preserve the model's proportions,
without the source catalog's filenames, paths or provenance. Administrator
configuration is an explicit mode; reference
synchronization, creation, catalog and editor controls appear only in that mode.
Team Leader and Task Force inspect areas, linked assets and source evidence.

Only Administrator configuration renders a private image on the reference plane
and enables source previews. Leaving configuration removes images and disposes
their textures. Operational viewing, including Administrator viewing and WebGL
failure, never requests or displays an image. Current server authorization also
denies direct image URLs to other profiles or revoked management grants.

In configuration, use reusable Conveyor, Curve, S-curve, Junction, Lift, Sensor,
Scanner, Scale and Cabinet templates; add at the center
or choose **Place on reference**. **Trace conveyor** takes two image-local endpoints.
Select a component in 3D or the accessible list, edit its fields, duplicate it or move
it through labelled controls. Duplication deliberately clears the canonical asset
link and survey evidence. Save requires a revision note; stale edits conflict rather
than overwriting another user's revision. Revisions and former placements remain
immutable. Changing a scene's reference starts an empty draft so old coordinates are
not silently reinterpreted on another drawing.

Search registered assets by code/name or source aliases. Multiple results are shown
explicitly, with placement navigation and an unplaced filter. No source label or
colored screenshot symbol creates a canonical asset automatically. Searches return
at most 200 assets; refine the query rather than interpreting the limit as a complete
site inventory. Each linked source independently enforces its permission. Problem
badges are dated Handover/Maintenance evidence with source navigation and coverage;
absence of a badge does not establish equipment health.

Coordinates are normalized to a specific reference: origin top-left, x right and
image y down. Rendering maps image y to depth and optional elevation to the vertical
axis. Unit sizes are schematic, not meters. A surveyed placement needs an explicit
registered asset, elevation and evidence; scene calibration needs its own evidence.
Exact heights, scale, sensor positions and whole-plant alignment remain plant input.
The overview arranges 3D area tiles for navigation, not physical adjacency.
Curves use centered, independently sized footprints and smooth continuous surfaces;
the S-curve template represents opposing bends. Width/depth describe the unrotated
footprint, and rotation uses the same center as straight components. Existing
private traces may need position/rotation corrections after visual comparison;
bootstrap continues to preserve saved scene edits and never replaces them.

The renderer uses Three.js behind an adapter, including
[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html). Drag to orbit,
right-drag to pan and scroll to zoom. The focused scene region also supports arrow
keys to rotate, plus/minus to zoom, Home to reset and T for top view. Devices without
[WebGL 2](https://threejs.org/docs/pages/WebGLRenderer.html) keep the same accessible
list/editor workflow. Rendering is on demand; resize and controls trigger updates,
and unmounting disposes textures, geometry, materials and the graphics context.
Component selection updates the existing materials without recreating the context.
Reference textures use at most 2048 pixels per side (also limited by the device),
no mipmap copies, and a maximum render pixel ratio of 1.5. Context loss activates
the accessible list; the private-image fallback is available only while editing.
Original private files retain their
integrity, dimensions and authorized delivery rules.

## Verification

Focused API tests cover admission, bootstrap preservation, asset/reference validation,
optimistic conflicts, authorization and private files. Web tests cover real solid
geometry, all templates, source navigation, no-WebGL editing and revision saves.
The PostgreSQL suite covers forced RLS, current profiles/grants, concurrent edits,
immutable revisions and retained placements. Root integration additionally checks
the host wiring, generated OpenAPI and actual desktop/narrow rendering.
