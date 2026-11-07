/** Internal SQL expressions only; rule fields/values are validated JSON, never SQL fragments.
 * Exclusions filter analytical reads, preserving source rows and projection integrity checks.
 */
export function includedReportingValues(
  values = "values",
  config = "(SELECT config FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3)",
): string {
  return `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(${config}->'excludedValues','[]'::jsonb)) excluded_rule
    WHERE ${values}->>(excluded_rule->>'field')=excluded_rule->>'value')`;
}
