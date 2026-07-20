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
            {items.map((row) => {
              const selected = selectedId === row.memberId;
              return (
                <li key={row.paymentId || row.memberId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`bo-review-queue-item${selected ? " selected" : ""}`}
                    onClick={() => onSelect(row.memberId)}
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
