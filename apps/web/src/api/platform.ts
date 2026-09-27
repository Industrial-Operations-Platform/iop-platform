import type { components } from "./schema";
export type Context = components["schemas"]["DemoContextDto"];
export type ImportSummary = components["schemas"]["ImportSummaryDto"];
export type ImportReview = components["schemas"]["ImportReviewDto"];
export type Availability = components["schemas"]["AvailabilityDto"];
export type Selection = components["schemas"]["SelectionDto"];
export type Analysis = components["schemas"]["AnalysisDto"];
export type Options = components["schemas"]["OptionsDto"];
export type Option = components["schemas"]["OptionDto"];
export type Dimension = "sector" | "area" | "equipment" | "message";
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly traceId?: string,
    readonly importId?: string,
  ) {
    super(
      code === "analytics_projection_unavailable"
        ? "The analytical history needs preparation. Restart the local application with an administrator configured."
        : code === "analytics_revision_changed"
          ? "The imported data changed. Refresh the data before continuing."
          : status === 401
            ? "Select a local user to continue."
            : status === 403
              ? "This user or browser is not permitted to perform this operation."
              : status === 413
                ? "The CSV exceeds the 5 MiB upload limit."
                : status === 503
                  ? "The service is unavailable or busy. Check the API and try again."
                  : code === "invalid_filename"
                    ? "Use the supported filename Hitliste-YYYYMMDD.csv."
                    : code === "import_capacity"
                      ? "The local storage limit has been reached."
                      : "The operation could not be completed. Check the input and try again.",
    );
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  filename?: string,
): Promise<T> {
  const response = await fetch("/api/v1" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    signal,
    headers:
      body === undefined
        ? {}
        : {
            "Content-Type": filename
              ? "application/octet-stream"
              : "application/json",
            "X-IOP-Demo": "1",
            ...(filename ? { "X-CSV-Filename": filename } : {}),
          },
    ...(body === undefined
      ? {}
      : { body: filename ? (body as Blob) : JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => {
    throw new ApiError(503, "invalid_response");
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      data.code ?? "request_failed",
      data.traceId,
      data.importId,
    );
  return data as T;
}
export const tomorrow = (date: string): string =>
  new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
export const count = (n: number): string =>
  new Intl.NumberFormat("en-GB").format(n);
export const duration = (seconds: number): string =>
  `${count(Math.floor(seconds / 3600))}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
