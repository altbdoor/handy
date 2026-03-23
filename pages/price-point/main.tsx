import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PricePoint } from "./PricePoint";
import "./style.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PricePoint />
    </StrictMode>,
  );
}
