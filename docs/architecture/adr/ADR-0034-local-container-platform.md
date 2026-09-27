# ADR-0034 — Local container platform and historical seed

## Status

Accepted by the owner's explicit request on 2026-09-27 for separate frontend,
backend and database Docker containers, backup analytics seed and application
composition without demo directories.

## Decision

Extend ADR-0018/0030 with an explicit local-container execution mode. Only the web
entry point is published on host loopback; API and database remain on the private
Compose network. The web proxy preserves the validated browser Host and Origin.
Local administrator selection remains a replaceable development identity adapter,
not shared-user authentication. Runtime retains narrow database grants and RLS.

Application composition lives in a neutral host directory. Business domain/application
ports remain inward-owned under ADR-0032. Local lifecycle and seed tooling live in
scripts/infrastructure, outside business modules. Explicit provisioning runs before
API startup using separate credentials; the running API receives only runtime secrets.

The private backup is an optional local seed input, never an image/repository asset.
Extract known analytics facts and their referenced source catalogs without executing
archive SQL. Derived daily CSVs use the real admission pipeline, exact original
durations and deterministic ordering. Preserve archive/source-row provenance in a
private manifest; do not claim these generated files are original exports. Check all
existing seed dates before imports; matching bytes are idempotent, conflicting data
fails without replacing history. A dedicated persistent installation protects earlier
native development data. Later user uploads survive subsequent starts.

## Consequences

Docker Compose becomes the primary local application path. The native path remains
available for tests and debugging. This decision does not authorize production login,
external network exposure, destructive resets or publishing private historical data.
