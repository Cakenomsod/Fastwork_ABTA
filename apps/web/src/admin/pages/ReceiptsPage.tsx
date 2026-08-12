import { useEffect, useId, useState, type FormEvent } from "react";

import {
  searchAdminReceipts,
  type AdminMe,
  type ListPageSize,
  type ReceiptKind,
  type ReceiptSearchItem,
} from "../../lib/admin-api";
import { ListPager } from "../ListPager";

const ERROR_LABEL: Record<string, string> = {
  search_failed: "ค้นหาไม่สำเร็จ — ลองใหม่หรือลดเงื่อนไข",
  receipt_kind_required:
    "เลือกประเภทใบเสร็จ (ตัวจริงหรือชั่วคราว) เมื่อระบุเลขที่",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์ค้นหาใบเสร็จ",
};

function formatAmount(amount?: number): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("th-TH")} บาท`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function receiptTone(status: string): string {
  if (status === "official") return "active";
  if (status === "temp" || status === "pending_review") return "near-expiry";
  if (status === "rejected") return "danger";
  return "neutral";
}

function receiptPrefix(kind: ReceiptKind): string {
  return kind === "temp" ? "RC-T-…-" : "RC-…-";
}

function openPrint(path: string, autoPrint = false) {
  const url = autoPrint
    ? `${path}${path.includes("?") ? "&" : "?"}print=1`
    : path;
  window.open(url, "_blank", "noopener,noreferrer");
}

function hasSearchCriteria(opts: {
  receiptSeq: string;
  memberId: string;
  firstName: string;
  lastName: string;
  phone: string;
}): boolean {
  return Boolean(
    opts.receiptSeq.trim() ||
      opts.memberId.trim() ||
      opts.firstName.trim() ||
      opts.lastName.trim() ||
      opts.phone.trim(),
  );
}

export default function ReceiptsPage(_props: { me: AdminMe }) {
  const formId = useId();
  const [receiptKind, setReceiptKind] = useState<ReceiptKind>("official");
  const [receiptSeq, setReceiptSeq] = useState("");
  const [memberId, setMemberId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<ReceiptSearchItem[]>([]);
  const [matched, setMatched] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(10);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(nextPage = 1, nextPageSize?: ListPageSize) {
    const criteria = {
      receiptSeq,
      memberId,
      firstName,
      lastName,
      phone,
    };
    if (!hasSearchCriteria(criteria)) {
      setError("ระบุเลขที่ใบเสร็จ หรือข้อมูลสมาชิกอย่างน้อยหนึ่งอย่าง");
      return;
    }
    if (receiptSeq.trim() && !receiptKind) {
      setError(ERROR_LABEL.receipt_kind_required);
      return;
    }

    const size = nextPageSize ?? pageSize;
    setLoading(true);
    setError(null);
    try {
      const result = await searchAdminReceipts({
        receiptKind: receiptSeq.trim() ? receiptKind : undefined,
        receiptSeq: receiptSeq.trim() || undefined,
        memberId: memberId.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        page: nextPage,
        pageSize: size,
      });
      setItems(result.items);
      setMatched(result.matched);
      setPage(result.page);
      setPageCount(result.pageCount);
      if (nextPageSize != null) setPageSize(nextPageSize);
      setSearched(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : "search_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch(1);
  }

  function resetForm() {
    setReceiptKind("official");
    setReceiptSeq("");
    setMemberId("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setItems([]);
    setMatched(0);
    setSearched(false);
    setError(null);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("receiptKind");
    const seq =
      params.get("receiptSeq") ?? params.get("receiptNumber") ?? params.get("q");
    const mid = params.get("memberId");
    const fn = params.get("firstName");
    const ln = params.get("lastName");
    const ph = params.get("phone");
    if (kind === "temp" || kind === "official") setReceiptKind(kind);
    if (seq) setReceiptSeq(seq);
    if (mid) setMemberId(mid);
    if (fn) setFirstName(fn);
    if (ln) setLastName(ln);
    if (ph) setPhone(ph);
    if (seq || mid || fn || ln || ph) {
      void runSearch(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const receiptHint = receiptSeq.trim()
    ? `${receiptPrefix(receiptKind)}${receiptSeq.trim()}`
    : `${receiptPrefix(receiptKind)}0001`;

  const rangeStart = matched === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, matched);

  return (
    <div className="bo-receipts">
      <form
        id={formId}
        className="bo-panel bo-receipts-search"
        onSubmit={onSubmit}
      >
        <div className="bo-panel-head bo-receipts-search__head">
          <h2>ค้นหาใบเสร็จ</h2>
          <p>
            กรอก<strong>อย่างน้อยหนึ่งช่อง</strong> — เลขที่ใบเสร็จ
            หรือข้อมูลสมาชิก — แล้วกดค้นหา
          </p>
        </div>

        <div className="bo-receipts-search__body">
          {error ? (
            <p className="bo-error bo-receipts-search__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="bo-receipts-search__sections">
            <section
              className="bo-receipts-section"
              aria-labelledby={`${formId}-receipt`}
            >
              <h3 className="bo-receipts-section__title" id={`${formId}-receipt`}>
                เลขที่ใบเสร็จ
              </h3>
              <div className="bo-receipts-section__body">
                <div className="bo-filter-group">
                  <span className="bo-filter-label">ประเภท</span>
                  <div
                    className="bo-seg"
                    role="group"
                    aria-label="ประเภทใบเสร็จ"
                  >
                    <button
                      type="button"
                      className={`bo-seg-btn${receiptKind === "official" ? " is-active" : ""}`}
                      onClick={() => setReceiptKind("official")}
                    >
                      ตัวจริง
                    </button>
                    <button
                      type="button"
                      className={`bo-seg-btn${receiptKind === "temp" ? " is-active" : ""}`}
                      onClick={() => setReceiptKind("temp")}
                    >
                      ชั่วคราว
                    </button>
                  </div>
                </div>
                <label
                  className="bo-field bo-receipts-seq-field"
                  htmlFor={`${formId}-receipt-seq`}
                >
                  <span>เลขที่ (กรอกเฉพาะตัวเลข)</span>
                  <div className="bo-receipts-seq-input">
                    <span className="bo-receipts-seq-prefix" aria-hidden="true">
                      {receiptPrefix(receiptKind)}
                    </span>
                    <input
                      id={`${formId}-receipt-seq`}
                      type="search"
                      value={receiptSeq}
                      onChange={(e) =>
                        setReceiptSeq(e.target.value.replace(/[^\d-]/g, ""))
                      }
                      placeholder="0001 หรือ 2026-0001"
                      autoComplete="off"
                      inputMode="numeric"
                      aria-describedby={`${formId}-receipt-hint`}
                    />
                  </div>
                  <span
                    className="bo-receipts-seq-hint"
                    id={`${formId}-receipt-hint`}
                  >
                    ตัวอย่าง: <code>{receiptHint}</code>
                  </span>
                </label>
              </div>
            </section>

            <div className="bo-receipts-divider" aria-hidden="true">
              <span>หรือ</span>
            </div>

            <section
              className="bo-receipts-section"
              aria-labelledby={`${formId}-member`}
            >
              <h3 className="bo-receipts-section__title" id={`${formId}-member`}>
                ข้อมูลสมาชิก
                <span className="bo-receipts-section__optional">
                  กรอกช่องไหนก็ได้
                </span>
              </h3>
              <div className="bo-receipts-member-grid">
                <label className="bo-field" htmlFor={`${formId}-member-id`}>
                  <span>เลขสมาชิก</span>
                  <input
                    id={`${formId}-member-id`}
                    type="search"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    placeholder="ABTA-2026-0001"
                    autoComplete="off"
                  />
                </label>
                <label className="bo-field" htmlFor={`${formId}-phone`}>
                  <span>เบอร์โทร</span>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812345678"
                    autoComplete="off"
                    inputMode="tel"
                  />
                </label>
                <label className="bo-field" htmlFor={`${formId}-first-name`}>
                  <span>ชื่อ</span>
                  <input
                    id={`${formId}-first-name`}
                    type="search"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ชื่อ"
                    autoComplete="off"
                  />
                </label>
                <label className="bo-field" htmlFor={`${formId}-last-name`}>
                  <span>นามสกุล</span>
                  <input
                    id={`${formId}-last-name`}
                    type="search"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    autoComplete="off"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="bo-receipts-search__actions">
            <button
              type="submit"
              className="bo-btn bo-btn-primary"
              disabled={loading}
            >
              {loading ? "กำลังค้นหา…" : "ค้นหา"}
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={loading}
              onClick={resetForm}
            >
              ล้างเงื่อนไข
            </button>
          </div>
        </div>
      </form>

      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>ผลการค้นหา</h2>
          {searched && !loading && matched > 0 ? (
            <span className="bo-muted bo-receipts-result-count">
              {rangeStart.toLocaleString("th-TH")}–
              {rangeEnd.toLocaleString("th-TH")} จาก{" "}
              {matched.toLocaleString("th-TH")} รายการ
            </span>
          ) : searched && !loading ? (
            <span className="bo-muted bo-receipts-result-count">
              พบ {matched.toLocaleString("th-TH")} รายการ
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="bo-empty bo-empty--loading">กำลังค้นหา…</div>
        ) : !searched ? (
          <div className="bo-empty bo-empty--guide">
            <strong>ยังไม่ได้ค้นหา</strong>
            กรอกเลขที่ใบเสร็จ หรือชื่อ / เลขสมาชิก / เบอร์โทร อย่างน้อยหนึ่งช่อง
            แล้วกดค้นหา
          </div>
        ) : items.length === 0 ? (
          <div className="bo-empty bo-empty--guide">
            <strong>ไม่พบใบเสร็จ</strong>
            ลองตรวจสอบเงื่อนไขอีกครั้ง หรือลดจำนวนฟิลด์ที่กรอก
          </div>
        ) : (
          <>
            <div className="bo-table-wrap">
              <table className="bo-table bo-table--cards bo-receipts-table">
                <thead>
                  <tr>
                    <th>เลขที่ใบเสร็จ</th>
                    <th>สมาชิก</th>
                    <th>รายการ</th>
                    <th>ยอดเงิน</th>
                    <th>สถานะ</th>
                    <th>วันที่</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.paymentId}>
                      <td data-label="เลขที่">
                        <code className="bo-receipts-code">
                          {row.receiptNumber}
                        </code>
                      </td>
                      <td data-label="สมาชิก">
                        <strong>{row.fullName || "—"}</strong>
                        <div className="bo-muted bo-receipts-member-id">
                          {row.memberId}
                        </div>
                        {row.phone ? (
                          <div className="bo-muted bo-receipts-member-phone">
                            {row.phone}
                          </div>
                        ) : null}
                      </td>
                      <td data-label="รายการ">{row.paymentKindLabel}</td>
                      <td
                        data-label="ยอด"
                        className="bo-receipts-amount"
                      >
                        {formatAmount(row.amount)}
                      </td>
                      <td data-label="สถานะ">
                        <span
                          className={`bo-badge ${receiptTone(row.receiptStatus)}`}
                        >
                          {row.receiptStatusLabel}
                        </span>
                      </td>
                      <td data-label="วันที่">
                        {formatDate(row.verifiedAt ?? row.createdAt)}
                      </td>
                      <td data-label="จัดการ">
                        <div className="bo-receipts-row-actions">
                          <button
                            type="button"
                            className="bo-btn bo-btn-ghost bo-btn-sm"
                            onClick={() => openPrint(row.printPath)}
                          >
                            เปิดใบเสร็จ
                          </button>
                          <button
                            type="button"
                            className="bo-btn bo-btn-primary bo-btn-sm"
                            onClick={() => openPrint(row.printPath, true)}
                          >
                            พิมพ์
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {matched > 0 ? (
              <ListPager
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                disabled={loading}
                onPrev={() => void runSearch(page - 1)}
                onNext={() => void runSearch(page + 1)}
                onPageSizeChange={(v) => void runSearch(1, v)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
