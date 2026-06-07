import react from "@vitejs/plugin-react";
import { existsSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { defineConfig } from "vite";

const pagesDir = resolve(import.meta.dirname, "pages");

const pagesValidDirs = readdirSync(pagesDir)
  .filter((name) => {
    return existsSync(join(pagesDir, name, "index.html"));
  })
  .sort();

const pagesInputs = pagesValidDirs
  .flatMap((val) => {
    const dir = join(pagesDir, val);
    return readdirSync(dir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => join(val, file));
  })
  .reduce(
    (acc, filePath) => {
      const key = filePath.replace(/\.html$/, "");
      acc[key] = join(pagesDir, filePath);
      return acc;
    },
    {} as { [key: string]: string },
  );

function toEmojiCode(emoji: string) {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16) ?? "")
    .filter((code) => code !== "fe0f")
    .filter(Boolean)
    .join("_");
}

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  resolve: {
    alias: {
      "react-compat": "preact/compat",
      "react-compat-dom": "preact/compat",
      "react-compat/jsx-runtime": "preact/jsx-runtime",
    },
  },
  build: {
    reportCompressedSize: false,
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        ...pagesInputs,
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules\/react(-dom)?\//,
            },
            {
              name: "preact",
              test: /node_modules\/preact\//,
            },
            {
              name: "alpinejs",
              test: /node_modules\/alpinejs\//,
            },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    {
      name: "react-compat-jsx-pragma",
      enforce: "pre",
      transform: {
        filter: {
          code: { include: '"react-compat"' },
          id: { include: /\.tsx$/ },
        },
        handler(code) {
          return "/** @jsxImportSource react-compat */\n" + code;
        },
      },
    },
    {
      name: "list-sites-in-homepage",
      transformIndexHtml: async (html) => {
        let patchedHtml = html;

        // convert emoji favicons
        const faviconTest = /__FAVICON:(.+?)__/g;

        patchedHtml = patchedHtml.replace(faviconTest, (_match, p1) => {
          const emojiCode = toEmojiCode(p1);

          if (emojiCode) {
            const cdnBase = `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.051`;
            return [
              `<link rel="icon" href="${cdnBase}/png/32/emoji_u${emojiCode}.png" sizes="32x32" />`,
              `<link rel="apple-touch-icon" href="${cdnBase}/png/512/emoji_u${emojiCode}.png" />`,
            ].join("\n");
          }

          return "";
        });

        // handle home page listing
        if (patchedHtml.includes("__PAGES__")) {
          const pagesLinks = pagesValidDirs.map((dir) => {
            return `
              <li>
                <a href="./${basename(pagesDir)}/${dir}/">
                  ${dir}
                </a>
              </li>
            `;
          });

          patchedHtml = patchedHtml.replace("__PAGES__", `<ul>${pagesLinks.join("")}</ul>`);
        }

        return patchedHtml;
      },
    },
  ],
  server: {
    port: 3000,
  },
});
