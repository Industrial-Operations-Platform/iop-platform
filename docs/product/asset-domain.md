# Configurable Asset domain

Asset management extends the existing Digital Asset Record through scoped,
versioned sidecars. Existing registry codes, aliases, lifecycle, locations and
Maintenance references retain their contracts. The workspace has inventory,
type-catalog, source-mapping and canonical-Pareto views.

Only Administrator can enter Asset management or configure the registry, types,
composition, metadata, survey decisions and source mappings, with current
`assets.read` / `assets.manage` grants. Team Leader and Task Force retain authorized
Digital Asset Record and operational reference reads under `assets.read`.
Source candidate lookup and
Pareto additionally require current `analytics.read`; import publication requires
`imports.submit` through a receiving-owned internal port and does not require a
registry grant or return registry data to native importers. A non-administrator
with stale management grants cannot configure assets.

## Asset model and review

The site catalog defines reusable type labels, containment/controller capabilities
and optional or required text, number, boolean and date metadata fields. Dedicated
manufacturer, model and serial fields preserve exact text, including leading zeros.
Editing a used schema cannot invalidate current records or reinterpret values.

An asset has at most one composition parent. Parents must be current, in the same
scope and containment-capable. Self/indirect cycles are rejected. Separate
`controlled-by` relationships identify a controller and channel; they do not
express composition or physical placement. Changes retain immutable revisions
and reject stale writes. Existing parent/controller capabilities cannot be removed
while incoming relations still depend on them.

Survey Pending, Validated and Rejected are attributed software decisions. Validation
or rejection requires a note and evidence reference. These decisions are independent
of registry Unverified/Validated/Retired and do not prove a physical plant inspection.
Evidence references and notes are supported; binary evidence storage and real
inspection documents remain external inputs.

## Reviewed canonical mappings

Select an imported original source-area/equipment tuple, add explicit canonical
candidates and record the review. An Approved mapping needs exactly one current,
validated registry asset; several Pending candidates remain Ambiguous. Rejected,
Pending, Ambiguous, Unmapped and not-yet-prepared facts are visible independently.
An existing tuple cannot silently move to another source identifier.

Assets owns reviews and immutable review revisions. OIP owns derived canonical
links to published aggregate facts and their immutable projection history. Mapping
changes and new import publications update links atomically on the original pinned
transaction. Original RAW bytes, normalized facts, source line identity and original
source-area/equipment fields remain intact. A failure to project rolls back the
review and its history. No identity is inferred from equipment wording or prefixes.

Canonical Pareto supports reported frequency or accumulated alarm seconds for an
explicit half-open reporting-date period, using the configured reporting calendar.
The denominator is the complete admitted source total, including unresolved facts;
ranking is limited to explicit mapped assets. Missing imports remain missing rather
than zero. Full/mapped/unresolved totals, states, admitted/missing dates and a
projection revision are displayed. Frequency is an aggregate, alarm seconds are
not downtime, and ranking does not establish causality. Large inventories and
mapping directories use bounded search pages with complete matching totals.

## Optional synthetic model

After the local Docker installation includes this module, run:

```sh
node scripts/local/asset-domain-demo.cjs --preview
node scripts/local/asset-domain-demo.cjs --apply
```

Preview is read-only. Apply freezes a private local manifest and creates four fresh,
clearly labelled fictional assets: a conveyor, controller, sensor and motor under
an existing configured location. It adds dedicated synthetic types, parent/controller
links, typed voltage metadata, all three survey decisions and a Pending ambiguous
mapping exercise. It never approves existing registry assets or fabricates RAW
imports. Repeated apply is idempotent and stops if someone changed the fixture.
There is no reset or destructive cleanup command.

The command requires the password-authenticated local Docker installation and a
current scoped startup administrator. The synthetic checklist is demonstration
content; it establishes no real plant survey or sensor association.

## Plant inputs still required

Operating-team review must supply actual type/field vocabulary, physical
composition/controller relationships, manufacturer/model/serial data, inspection
notes/evidence and explicit source-to-physical-identity decisions. Exact placement,
geometry and scale remain Asset Locator concerns. The software and adapters are
ready without claiming that these plant records have been collected.

See [ADR-0039](../architecture/adr/ADR-0039-asset-domain-enrichment.md) and
[IOP-209](../planning/items/IOP-209-asset-domain-completion.md) for decisions and evidence.
