import type { Gateway } from "../../application/improvement";
import type { AddEvidence, ActionView, Catalog, Comparison, ComparisonPage, CompareAction, EvidencePage, History, IssueReference, Page, SaveAction, SaveComparison, Selection } from "../../domain/models";
const messages: Record<string, string> = {
  invalid_improvement: "Check the improvement fields, dates and workflow requirements.",
  improvement_denied: "Improvement Tracking requires current Administrator, Team Leader or Task Force access.",
  improvement_conflict: "This improvement changed. Reload it before saving.",
  improvement_missing: "The action or linked reference is unavailable.",
  improvement_capacity: "The configured result limit was exceeded. Refine the selection.",
  improvement_analytics_unavailable: "Analytical evidence is unavailable. Check source preparation and retry."
};
async function request<T>(route: string, body: unknown): Promise<T> {
  const response = await fetch("/api/v1/improvements/" + route, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-IOP-Demo": "1"
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(messages[data.code] ?? "Improvement Tracking is unavailable. Sign in again or retry.");
  return data;
}
export class HttpImprovementGateway implements Gateway {
  catalog() {
    return request<Catalog>("catalog", {});
  }
  query(input: Selection) {
    return request<Page>("query", input);
  }
  save(input: SaveAction) {
    return request<ActionView>("save", input);
  }
  issues(search: string, cursor = "") {
    return request<{
      issues: IssueReference[];
      nextCursor: string;
    }>("issues", {
      search,
      cursor
    });
  }
  history(id: string, before = 0) {
    return request<History>("history", {
      id,
      before
    });
  }
  evidence(id: string, cursor = "") {
    return request<EvidencePage>("evidence", {
      id,
      cursor
    });
  }
  comparisons(id: string, cursor = "") {
    return request<ComparisonPage>("comparisons", {
      id,
      cursor
    });
  }
  addEvidence(input: AddEvidence) {
    return request<{
      action: ActionView;
      evidence: EvidencePage["evidence"][number];
    }>("add-evidence", input);
  }
  compare(input: CompareAction) {
    return request<Comparison>("compare", input);
  }
  saveComparison(input: SaveComparison) {
    return request<{
      action: ActionView;
      saved: ComparisonPage["comparisons"][number];
    }>("save-comparison", input);
  }
}
