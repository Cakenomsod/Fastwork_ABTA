import type { KeyboardEvent } from "react";

/** Shared props for `<tr className="bo-row-clickable">` — mouse + keyboard activate. */
export function clickableRowProps(opts: {
  onActivate: () => void;
  label: string;
  selected?: boolean;
}) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": opts.label,
    "aria-selected": opts.selected ? true : undefined,
    onClick: opts.onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        opts.onActivate();
      }
    },
  };
}
