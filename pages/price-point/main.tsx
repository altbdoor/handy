import { StrictMode } from "react-compat";
import { createRoot } from "react-compat-dom/client";
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
