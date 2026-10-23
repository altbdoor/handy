import "./style.css";
import Alpine from "alpinejs";

import { type UrlParams, urlParams } from "../_utils/alpine-url-params";

function root() {
  return {
    title: "Hello world",

    get self() {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      type ReAlpine = Alpine.XDataContext &
        Alpine.Magics<{}> & { $store: { urlParams: UrlParams } };
      return this as unknown as ReAlpine;
    },

    async init() {},
  };
}

Alpine.plugin(urlParams);
Alpine.data("root", root);
Alpine.start();
