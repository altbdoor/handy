import {
  createContext,
  use,
  useMemo,
  useRef,
  type PropsWithChildren,
} from "react";

type ImageCacheContextValue = {
  addCache: (key: string, blobUrl: string) => void;
  removeCache: (key: string) => void;
  clearCache: () => void;
  getCache: (key: string) => string | undefined;
};

const ImageCacheContext = createContext<ImageCacheContextValue | null>(null);

export function useImgCache() {
  const ctx = use(ImageCacheContext);
  if (!ctx) {
    throw new Error("invalid use of useImgCache");
  }
  return ctx;
}

export function ImageCacheProvider({ children }: PropsWithChildren) {
  const cache = useRef<{ [key: string]: string }>({});

  const api: ImageCacheContextValue = useMemo(() => {
    return {
      addCache: (key: string, blobUrl: string) => {
        cache.current[key] = blobUrl;
      },
      removeCache: (key: string) => {
        const blobUrl = cache.current[key];
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        delete cache.current[key];
      },
      clearCache: () => {
        Object.values(cache.current).forEach((url) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });

        cache.current = {};
      },
      getCache: (key: string) => {
        return cache.current[key];
      },
    };
  }, []);

  return <ImageCacheContext value={api}>{children}</ImageCacheContext>;
}
