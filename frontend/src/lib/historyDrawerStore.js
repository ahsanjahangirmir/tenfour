import { createContext, useContext } from "react";

export const HistoryDrawerContext = createContext(null);

export function useHistoryDrawer() {
  const ctx = useContext(HistoryDrawerContext);
  if (!ctx) throw new Error("useHistoryDrawer must be used within HistoryDrawerProvider");
  return ctx;
}
