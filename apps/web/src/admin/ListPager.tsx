import {
  LIST_PAGE_SIZE_OPTIONS,
  type ListPageSize,
} from "../lib/admin-api";

export function PageSizePicker(props: {
  value: ListPageSize;
  disabled?: boolean;
  onChange: (value: ListPageSize) => void;
}) {
  return (
    <div className="bo-page-size" role="group" aria-label="จำนวนต่อหน้า">
      <span className="bo-page-size-label">แสดง</span>
      <div className="bo-seg bo-seg--compact">
        {LIST_PAGE_SIZE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`bo-seg-btn${props.value === n ? " is-active" : ""}`}
            disabled={props.disabled}
            onClick={() => {
              if (props.value !== n) props.onChange(n);
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PagerChevron(props: { dir: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {props.dir === "left" ? (
        <path d="M15 18 9 12l6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

export function ListPager(props: {
  page: number;
  pageCount: number;
  pageSize: ListPageSize;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (value: ListPageSize) => void;
}) {
  return (
    <div className="bo-pager" role="navigation" aria-label="เลื่อนหน้ารายชื่อ">
      <PageSizePicker
        value={props.pageSize}
        disabled={props.disabled}
        onChange={props.onPageSizeChange}
      />
      <div className="bo-pager-nav">
        <button
          type="button"
          className="bo-pager-btn"
          aria-label="หน้าก่อนหน้า"
          disabled={props.disabled || props.page <= 1}
          onClick={props.onPrev}
        >
          <PagerChevron dir="left" />
        </button>
        <span className="bo-pager-label">
          หน้า {props.page.toLocaleString("th-TH")} /{" "}
          {props.pageCount.toLocaleString("th-TH")}
        </span>
        <button
          type="button"
          className="bo-pager-btn"
          aria-label="หน้าถัดไป"
          disabled={props.disabled || props.page >= props.pageCount}
          onClick={props.onNext}
        >
          <PagerChevron dir="right" />
        </button>
      </div>
    </div>
  );
}
