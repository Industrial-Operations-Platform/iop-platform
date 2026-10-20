import { localAlarmClassification } from '../src/host/local-alarm-classification';
import type { ClassificationEvidence } from '../src/modules/asset-locator/application/classification-evidence';

const source = (message: string): ClassificationEvidence => ({ assetId:'registered-equipment', coverage:'limited', totalSources:1, sources:[{
  sourceId:'configured-source',area:'Original area',code:'Original code',origin:'exact-alias',mappingId:'',mappingRevision:0,total:300,
  evidence:[{importId:'original-import',sourceRecordNumber:42,reportingDate:'2026-10-14',message}],
}] });
test('owner-provided German message suggests only a provisional photoelectric type and retains exact source provenance', () => {
  const evidence = source('Lichtschranke zu lange belegt'), result = localAlarmClassification(evidence);
  expect(result).toMatchObject({...evidence,suggestedKind:'photoelectric-sensor',matchedMessages:1});
  expect(result.sources).toBe(evidence.sources); expect(evidence).not.toHaveProperty('suggestedKind');
  expect(localAlarmClassification(source('Area: LICHTSCHRANKE  zu lange belegt.')).suggestedKind).toBe('photoelectric-sensor');
});
test('unsupported or absent messages never manufacture a classification or physical identity', () => {
  expect(localAlarmClassification(source('Motor fault'))).toMatchObject({suggestedKind:'',matchedMessages:0});
  expect(localAlarmClassification(source('Lichtschrankenkette zu lange belegt'))).toMatchObject({suggestedKind:'',matchedMessages:0});
  expect(localAlarmClassification({assetId:'registered-equipment',coverage:'unmapped',totalSources:0,sources:[]})).toMatchObject({suggestedKind:'',sources:[]});
});
