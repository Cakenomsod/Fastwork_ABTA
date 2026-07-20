import { useEffect, useState } from "react";
import {
  approveSlipReview,
  fetchMemberDetail,
  fetchPendingSlipReviews,
  rejectSlipReview,
  type AdminMe,
  type MemberDetail,
  type QueueItem,
} from "../../lib/admin-api";
import MemberDetailExtras from "../MemberDetailExtras";
import SlipImage from "../SlipImage";

export default function SlipReviewPage(props: {
  me: AdminMe;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPendingSlipReviews();
      setItems(list);
      if (selectedId && !list.some((i) => i.memberId === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchMemberDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function onApprove() {
    if (!selectedId) return;
    if (!window.confirm("ยืนยันสลิปและออกใบเสร็จตัวจริง?")) return;
    setBusy(true);
    setError(null);
    try {
      const result = await approveSlipReview(selectedId);
      alert(`ออกใบเสร็จตัวจริงแล้ว: ${result.receiptNumber ?? "—"}`);
      setSelectedId(null);
      setDetail(null);
      setShowReject(false);
      await reload();
      props.onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "approve_failed");
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!selectedId) return;
    if (!rejectReason.trim()) {
      setError("กรุณาระบุเหตุผลการปฏิเสธ");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await rejectSlipReview(selectedId, rejectReason.trim());
      alert(
        `ปฏิเสธสลิปแล้ว\nเลขใบเสร็จใหม่ (รอส่งสลิป): ${result.receiptNumber ?? "—"}`,
      );
      setSelectedId(null);
      setDetail(null);
      setRejectReason("");
      setShowReject(false);
      await reload();
      props.onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "reject_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-split">
      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>คิวรอตรวจสลิป ({items.length})</h2>
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm"
            onClick={() => void reload()}
          >
            รีเฟรช
          </button>
        </div>
        {error ? <div className="bo-error" style={{ margin: "0.75rem" }}>{error}</div> : null}
        {loading ? (
          <div className="bo-empty">กำลังโหลดคิว…</div>
        ) : items.length === 0 ? (
          <div className="bo-empty">
            <strong>ไม่มีรายการรอตรวจสลิป</strong>
            รอรายการที่นายทะเบียนอนุมัติข้อมูลแล้ว
          </div>
        ) : (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>เลขสมาชิก</th>
                  <th>ใบเสร็จ</th>
                  <th>จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.paymentId || row.memberId}
                    className={selectedId === row.memberId ? "selected" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedId(row.memberId);
                      setShowReject(false);
                      setRejectReason("");
                    }}
                  >
                    <td>{row.fullName}</td>
                    <td>
                      <code>{row.memberId}</code>
                    </td>
                    <td>
                      {row.receiptNumber || "—"}
                      {row.receiptStatus === "rejected" ? (
                        <>
                          {" "}
                          <span className="bo-badge pending">ถูกปฏิเสธ</span>
                        </>
                      ) : null}
                    </td>
                    <td>{row.amount != null ? `${row.amount} บาท` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="bo-detail">
        {!detail ? (
          <div className="bo-empty" style={{ padding: "1.5rem 0" }}>
            <strong>เลือกรายการ</strong>
            คลิกแถวเพื่อตรวจสลิป
          </div>
        ) : (
          <>
            <h3>ตรวจสลิป — {detail.fullName}</h3>
            <div className="bo-detail-row">
              <span>Member ID (ถาวร)</span>
              <strong>{detail.memberId}</strong>
            </div>
            <div className="bo-detail-row">
              <span>ใบเสร็จชั่วคราว</span>
              <strong>{detail.receiptNumber || "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>จำนวนเงิน</span>
              <strong>{detail.amount != null ? `${detail.amount} บาท` : "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>สถานะใบเสร็จ</span>
              <strong>{detail.receiptStatus || "—"}</strong>
            </div>

            <MemberDetailExtras
              detail={detail}
              me={props.me}
              onSaved={(m) => {
                setDetail(m);
                if (m.memberId !== selectedId) {
                  setSelectedId(m.memberId);
                }
                void reload();
                props.onChanged?.();
              }}
              onDeleted={() => {
                setDetail(null);
                setSelectedId(null);
                void reload();
                props.onChanged?.();
              }}
            />

            <div className="bo-slip" style={{ minHeight: 240 }}>
              <SlipImage slipViewUrl={detail.slipViewUrl} emptyHint="ไม่พบรูปสลิป" />
            </div>

            <div className="bo-actions">
              <button
                type="button"
                className="bo-btn bo-btn-success"
                disabled={busy || detail.receiptStatus === "official"}
                onClick={() => void onApprove()}
              >
                ยืนยัน — ออกใบเสร็จตัวจริง
              </button>
              <button
                type="button"
                className="bo-btn bo-btn-danger"
                disabled={busy}
                onClick={() => setShowReject((v) => !v)}
              >
                ไม่ผ่าน
              </button>
            </div>

            {showReject ? (
              <div className="bo-form-grid" style={{ marginTop: "0.85rem" }}>
                <div className="bo-field">
                  <label htmlFor="slip-reject">เหตุผล (จำเป็น)</label>
                  <textarea
                    id="slip-reject"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เช่น จำนวนเงินไม่ตรง / สลิปไม่ชัด"
                  />
                </div>
                <button
                  type="button"
                  className="bo-btn bo-btn-danger"
                  disabled={busy}
                  onClick={() => void onReject()}
                >
                  ยืนยันปฏิเสธ + ออกเลขใบเสร็จใหม่
                </button>
              </div>
            ) : null}

            <div className="bo-note">
              เมื่อไม่ผ่าน: สมาชิกยังเป็นสมาชิกสมบูรณ์ (เลขถาวรคงเดิม) · ส่งสลิปใหม่แล้ววนกลับคิวเหรัญญิก
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
