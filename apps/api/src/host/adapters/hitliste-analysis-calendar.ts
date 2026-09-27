import { AnalysisCalendar } from "../../modules/oip/domain/analysis-calendar";

/** The configured Hitliste source excludes Sundays from analytical interpretation. */
export const hitlisteAnalysisCalendar = new AnalysisCalendar([7]);
