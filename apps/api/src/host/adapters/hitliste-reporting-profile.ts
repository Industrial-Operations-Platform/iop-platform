import type { SourceMappingConfiguration } from "../../modules/integrations";
import type { ReportingProfile } from "../../modules/oip/domain/reporting-profile";

/** Source-specific defaults are wired here, outside the generic reporting core. */
export function hitlisteReportingProfile(
  mappings: SourceMappingConfiguration,
): ReportingProfile {
  const labels = new Map(mappings.sectors.map((x) => [x.sectorKey, x.label]));
  return {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: true },
    unclassifiedLabel: "Nicht klassifiziert",
    areaSectors: mappings.areas.map((x) => ({
      area: x.sourceArea,
      sector: labels.get(x.sectorKey)!,
    })),
    aliases: [],
    executiveKpis: [
      ["blocked-light-barrier", "Lichtschranke zu lange belegt"],
      ["update-error-rate", "Fehlerquote an Update zu hoch"],
      ["collective-fault", "Sammelstörung"],
      ["volume-reducer", "Volumenreduzierer: Sammelstörung"],
    ].map(([id, message]) => ({
      id,
      label: message,
      message,
      metric: "frequency",
      goal: null,
    })),
  };
}
