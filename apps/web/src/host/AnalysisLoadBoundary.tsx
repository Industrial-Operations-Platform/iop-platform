import { Component, type ReactNode } from "react";
import { Alert, Button, Panel } from "../design/components";
import { t } from "../localization/i18n";

/** A failed presentation chunk must leave the workspace navigation available. */
export class AnalysisLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Panel>
        <Alert>{t("The analysis workspace could not be loaded. Reload the page to try again.")}</Alert>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t("Reload workspace")}
        </Button>
      </Panel>
    );
  }
}
