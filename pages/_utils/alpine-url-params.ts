import type { Alpine } from "alpinejs";

function readUrlParams(): Partial<Record<string, string>> {
  return Object.fromEntries(new URLSearchParams(location.search));
}

const ctrl = {
  params: readUrlParams(),
  _readUrlParams: readUrlParams,

  set(nextParams: Record<string, string>) {
    const searchParams = new URLSearchParams(nextParams);
    history.replaceState({}, "", `?${searchParams.toString()}`);
    this.params = readUrlParams();
  },

  update(nextParams: Record<string, string | null>) {
    const searchParams = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(nextParams)) {
      if (value === null) {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
    }

    history.replaceState({}, "", `?${searchParams.toString()}`);
    this.params = readUrlParams();
  },
};

export type UrlParams = typeof ctrl;

export function urlParams(alp: Alpine) {
  alp.store("urlParams", ctrl);
}
