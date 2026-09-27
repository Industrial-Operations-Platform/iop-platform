import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticalApp } from "./host/AnalyticalApp";
import "./design/base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticalApp />
  </StrictMode>,
);
