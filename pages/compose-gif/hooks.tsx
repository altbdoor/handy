import {
  createContext,
  use,
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";

type ImageCacheContextValue = {
  addCache: (key: string, blobUrl: string) => void;
  removeCache: (key: string) => void;
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
  const cache = useRef<Map<string, string>>(new Map());

  const api = useRef<ImageCacheContextValue>({
    addCache: (key: string, blobUrl: string) => {
      cache.current.set(key, blobUrl);
    },
    removeCache: (key: string) => {
      const blobUrl = cache.current.get(key);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }

      cache.current.delete(key);
    },
    getCache: (key: string) => {
      return cache.current.get(key);
    },
  });

  useEffect(() => {
    return () => {
      cache.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      cache.current.clear();
    };
  }, []);

  return <ImageCacheContext value={api.current}>{children}</ImageCacheContext>;
}
