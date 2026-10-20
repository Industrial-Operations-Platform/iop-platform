import type { ClassificationEvidence } from '../modules/asset-locator/application/classification-evidence';

/** Owner-supplied source vocabulary. It classifies message subjects, never equipment identities. */
export function localAlarmClassification(evidence: ClassificationEvidence) {
  const matches = evidence.sources.flatMap(source => source.evidence.filter(row =>
    /\blichtschranke\s+zu\s+lange\s+belegt\b/iu.test(row.message.normalize('NFKC')),
  ).map(row => ({ ...row, sourceId: source.sourceId, area: source.area, code: source.code })));
  return { ...evidence, suggestedKind: matches.length ? 'photoelectric-sensor' as const : '' as const, matchedMessages: matches.length };
}
