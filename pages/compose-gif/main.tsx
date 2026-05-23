import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Container } from "./Container";
import { ImageCacheProvider } from "./hooks";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ImageCacheProvider>
        <Container />
      </ImageCacheProvider>
    </StrictMode>,
  );
}
