import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Container } from "./Container";
// import "./style.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Container />
    </StrictMode>,
  );
}
