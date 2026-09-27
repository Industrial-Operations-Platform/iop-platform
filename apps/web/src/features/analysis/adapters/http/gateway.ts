import { api } from "../../../../api/platform";
import type { components } from "../../../../api/schema";
import type { AnalysisGateway } from "../../application/workspace";
import type { ReportRequest, ProfileResult } from "../../domain/models";
type Schemas = components["schemas"];

/** Transport DTOs are structurally checked against the inward-owned port. */
export class HttpAnalysisGateway implements AnalysisGateway {
  context() {
    return api<Schemas["DemoContextDto"]>("/demo/context");
  }
  chooseUser(userId: string) {
    return api<Schemas["DemoContextDto"]>("/demo/user", { userId });
  }
  availability() {
    return api<Schemas["AvailabilityDto"]>("/analytics/availability");
  }
  report(selection: ReportRequest) {
    return api<Schemas["ReportDto"]>("/analytics/report", selection);
  }
  profile() {
    return api<Schemas["ProfileResultDto"]>("/analytics/profile");
  }
  saveProfile(value: ProfileResult) {
    return api<Schemas["ProfileResultDto"]>("/analytics/profile", value);
  }
  history() {
    return api<Schemas["ImportSummaryDto"][]>("/imports");
  }
  upload(filename: string, bytes: ArrayBuffer) {
    return api<Schemas["ImportReviewDto"]>(
      "/imports",
      new Blob([bytes]),
      undefined,
      filename,
    );
  }
  review(id: string, recover: boolean) {
    return api<Schemas["ImportReviewDto"]>(
      `/imports/${encodeURIComponent(id)}${recover ? "/recover" : ""}`,
      recover ? {} : undefined,
    );
  }
  originalUrl(id: string) {
    return `/api/v1/imports/${encodeURIComponent(id)}/original`;
  }
}
