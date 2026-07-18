import { useEffect, useState } from "react";
import {
  approveDataReview,
  fetchMemberDetail,
  fetchPendingDataReviews,
  rejectDataReview,
  type MemberDetail,
  type QueueItem,
} from "../../lib/admin-api";
import SlipImage from "../SlipImage";

export default function DataReviewPage(props: { onChanged?: () => void }) {
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
      const list = await fetchPendingDataReviews();
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
    if (!window.confirm("อนุมัติข้อมูลนี้? จะ promote เลขถาวรและออกใบเสร็จชั่วคราว")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await approveDataReview(selectedId);
      alert(
        `อนุมัติแล้ว\nเลขถาวร: ${result.memberId}\nใบเสร็จชั่วคราว: ${result.receiptNumber ?? "—"}`,
      );
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
      await rejectDataReview(selectedId, rejectReason.trim());
      alert("ปฏิเสธแล้ว — แจ้งสมาชิกทาง LINE แล้ว");
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
          <h2>คิวรอตรวจข้อมูล ({items.length})</h2>
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
            <strong>ไม่มีรายการรอตรวจ</strong>
            คิวว่าง — รอใบสมัครใหม่
          </div>
        ) : (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>เลขชั่วคราว</th>
                  <th>โทร</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.memberId}
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
                    <td>{row.phone || "—"}</td>
                    <td>{formatDate(row.createdAt)}</td>
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
            คลิกแถวเพื่อดูรายละเอียดและดำเนินการ
          </div>
        ) : (
          <>
            <h3>{detail.fullName}</h3>
            <div className="bo-detail-row">
              <span>เลขสมาชิกชั่วคราว</span>
              <strong>{detail.memberId}</strong>
            </div>
            <div className="bo-detail-row">
              <span>เบอร์โทร</span>
              <strong>{detail.phone || "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>อีเมล</span>
              <strong>{detail.email || "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>นิติบุคคล</span>
              <strong>{detail.legalEntityName || "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>ชื่อตึก / หน่วยงาน</span>
              <strong>{detail.buildingName || detail.organization || "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>จำนวนเงิน</span>
              <strong>{detail.amount != null ? `${detail.amount} บาท` : "—"}</strong>
            </div>
            <div className="bo-detail-row">
              <span>ประเภท</span>
              <strong>{linkTypeLabel(detail.linkType)}</strong>
            </div>

            <div className="bo-slip">
              <SlipImage
                slipViewUrl={detail.slipViewUrl}
                emptyHint={
                  detail.hasSlip
                    ? "ไม่สามารถแสดงสลิปได้"
                    : "ยังไม่มีสลิป — ตรวจโดยเหรัญญิกในขั้นที่ 2"
                }
              />
            </div>

            <div className="bo-actions">
              <button
                type="button"
                className="bo-btn bo-btn-success"
                disabled={busy}
                onClick={() => void onApprove()}
              >
                อนุมัติ — promote + ใบเสร็จชั่วคราว
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
                  <label htmlFor="reject-reason">เหตุผลการปฏิเสธ (จำเป็น)</label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เช่น ชื่อไม่ตรงกับสลิป / ข้อมูลไม่ครบ"
                  />
                </div>
                <button
                  type="button"
                  className="bo-btn bo-btn-danger"
                  disabled={busy}
                  onClick={() => void onReject()}
                >
                  ยืนยันปฏิเสธ + แจ้ง LINE
                </button>
              </div>
            ) : null}

            <div className="bo-note">
              เมื่อไม่ผ่าน: ไม่ส่งต่อเหรัญญิก · ใบเสร็จยังไม่ออก · สมาชิกแก้ไขแล้ววนกลับคิวนายทะเบียน
            </div>
          </>
        )}
      </aside>
    </div>
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

function linkTypeLabel(t?: string): string {
  if (t === "renewal") return "ต่ออายุ";
  if (t === "legacy_bind") return "ผูกสมาชิกเก่า";
  return "สมัครใหม่";
}
