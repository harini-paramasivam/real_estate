import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface PageTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");
  const value = useMemo(() => ({ title, setTitle }), [title]);
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

export function usePageTitleContext(): PageTitleContextValue {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error("usePageTitleContext must be used within PageTitleProvider");
  return ctx;
}

export function usePageTitle(title: string) {
  const { setTitle } = usePageTitleContext();
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}
