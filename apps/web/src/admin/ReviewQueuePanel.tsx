import { useEffect, useRef, type KeyboardEvent } from "react";
import type { QueueItem } from "../lib/admin-api";

export interface ReviewQueuePanelProps {
  title: string;
  count: number;
  items: QueueItem[];
  selectedId: string | null;
  loading: boolean;
  variant: "data" | "slip";
  emptyTitle: string;
  emptyHint: string;
  error?: string | null;
  actionMessage?: string | null;
  showAlerts?: boolean;
  onSelect: (memberId: string) => void;
  onRefresh: () => void;
}

export default function ReviewQueuePanel(props: ReviewQueuePanelProps) {
  const {
    title,
    count,
    items,
    selectedId,
    loading,
    variant,
    emptyTitle,
    emptyHint,
    error,
    actionMessage,
    showAlerts = true,
    onSelect,
    onRefresh,
  } = props;

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, items.length);
  }, [items.length]);

  function focusOption(index: number) {
    const el = optionRefs.current[index];
    el?.focus();
  }

  function moveSelection(fromIndex: number, nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= items.length || nextIndex === fromIndex) {
      return;
    }
    onSelect(items[nextIndex]!.memberId);
    // Focus after parent clears detail / updates selection (detailReady lock stays intact).
    queueMicrotask(() => focusOption(nextIndex));
  }

  function onOptionKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (items.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveSelection(index, Math.min(index + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        moveSelection(index, Math.max(index - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        moveSelection(index, 0);
        break;
      case "End":
        e.preventDefault();
        moveSelection(index, items.length - 1);
        break;
      default:
        break;
    }
  }

  const activeIndex = selectedId
    ? items.findIndex((row) => row.memberId === selectedId)
    : -1;
  const tabbableIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <aside className="bo-review-queue" aria-label={title}>
      <div className="bo-review-queue-head">
        <div className="bo-review-queue-head-text">
          <h2>{title}</h2>
          <span className="bo-review-queue-count" aria-live="polite">
            {count}
          </span>
        </div>
        <button
          type="button"
          className="bo-btn bo-btn-ghost bo-btn-sm"
          onClick={() => void onRefresh()}
        >
          รีเฟรช
        </button>
      </div>

      {showAlerts && error ? (
        <div className="bo-review-queue-alert bo-error">{error}</div>
      ) : null}
      {showAlerts && actionMessage ? (
        <div className="bo-review-queue-alert bo-note">{actionMessage}</div>
      ) : null}

      <div className="bo-review-queue-body">
        {loading ? (
          <div className="bo-review-queue-status">กำลังโหลดคิว…</div>
        ) : items.length === 0 ? (
          <div className="bo-review-queue-empty">
            <span className="bo-review-empty-icon ok" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <strong>{emptyTitle}</strong>
            <span>{emptyHint}</span>
          </div>
        ) : (
          <ul className="bo-review-queue-list" role="listbox" aria-label={title}>
            {items.map((row, index) => {
              const selected = selectedId === row.memberId;
              return (
                <li key={row.paymentId || row.memberId}>
                  <button
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={index === tabbableIndex ? 0 : -1}
                    className={`bo-review-queue-item${selected ? " selected" : ""}`}
                    onClick={() => onSelect(row.memberId)}
                    onKeyDown={(e) => onOptionKeyDown(e, index)}
                  >
                    <span className="bo-review-queue-item-name">{row.fullName}</span>
                    {variant === "data" ? (
                      <span className="bo-review-queue-item-meta">
                        <code>{row.memberId}</code>
                        <span className="bo-review-queue-item-sep" aria-hidden="true">
                          ·
                        </span>
                        <span>{row.phone || formatDate(row.createdAt)}</span>
                      </span>
                    ) : (
                      <span className="bo-review-queue-item-meta">
                        <code>{row.memberId}</code>
                        <span className="bo-review-queue-item-sep" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          {row.receiptNumber || "—"}
                          {row.receiptStatus === "rejected" ? (
                            <>
                              {" "}
                              <span className="bo-badge pending">ถูกปฏิเสธ</span>
                            </>
                          ) : null}
                        </span>
                        {row.amount != null ? (
                          <span className="bo-review-queue-item-amount">
                            {row.amount} บาท
                          </span>
                        ) : null}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
