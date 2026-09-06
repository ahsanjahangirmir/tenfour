import { useMemo, useState } from "react";
import { HistoryDrawerContext } from "./historyDrawerStore";

export function HistoryDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      openHistory: () => setOpen(true),
      closeHistory: () => setOpen(false),
    }),
    [open],
  );

  return <HistoryDrawerContext.Provider value={value}>{children}</HistoryDrawerContext.Provider>;
}
