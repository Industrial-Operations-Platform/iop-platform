/** Adapter-only predicate shared by current reads; retained evidence reads omit it. */
export function activeImport(alias: string): string {
  return `NOT EXISTS(SELECT 1 FROM oip.publication_supersessions supersession
    WHERE supersession.organization_id=${alias}.organization_id
      AND supersession.site_id=${alias}.site_id AND supersession.source_id=${alias}.source_id
      AND supersession.replaced_import_id=${alias}.import_id)`;
}
