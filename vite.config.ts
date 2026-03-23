import { existsSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { defineConfig } from "vite";

const pagesDir = resolve(import.meta.dirname, "pages");

const pagesDirs = readdirSync(pagesDir).filter((name) =>
  existsSync(join(pagesDir, name, "index.html")),
);

const pagesInputs = pagesDirs.reduce(
  (acc, val) => {
    acc[`${val}/index`] = resolve(pagesDir, val, "index.html");
    return acc;
  },
  {} as { [key: string]: string },
);

export default defineConfig({
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
              test: /node_modules\/react/,
            },
            {
              name: "preact",
              test: /node_modules\/preact/,
            },
          ],
        },
      },
    },
  },
  plugins: [
    {
      name: "list-sites-in-homepage",
      transformIndexHtml(html, _ctx) {
        const faviconTest = /__FAVICON:(.+?)__/g;
        if (faviconTest.test(html)) {
          html = html.replaceAll(faviconTest, (_match, p1) => {
            let svgElem = `
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
                <text x='50' y='50' font-size='90' text-anchor='middle' dominant-baseline='central'>
                  ${p1}
                </text>
              </svg>
            `;

            svgElem = svgElem.replace(/\s+/g, " ").trim();
            return `data:image/svg+xml,${encodeURIComponent(svgElem)}`;
          });
        }

        if (html.includes("__PAGES__")) {
          const pagesLinks = pagesDirs.map((dir) => {
            return `
              <li>
                <a href="./${basename(pagesDir)}/${dir}/">
                  ${dir}
                </a>
              </li>
            `;
          });

          const htmlWithPages = html.replace(
            "__PAGES__",
            `<ul>${pagesLinks.join("")}</ul>`,
          );
          return htmlWithPages;
        }

        return html;
      },
    },
  ],
  server: {
    port: 3000,
  },
});
