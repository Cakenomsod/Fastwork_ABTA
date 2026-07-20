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
import MemberReviewSummary from "../MemberReviewSummary";
import ReviewActionBar from "../ReviewActionBar";
import ReviewDetailHeader from "../ReviewDetailHeader";
import ReviewQueuePanel from "../ReviewQueuePanel";
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
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  function selectRow(memberId: string) {
    setSelectedId(memberId);
    setShowReject(false);
    setRejectReason("");
    setActionMessage(null);
    setError(null);
  }

  async function onApprove() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    setActionMessage(null);
    try {
      const result = await approveSlipReview(selectedId);
      setActionMessage(
        `ออกใบเสร็จตัวจริงแล้ว: ${result.receiptNumber ?? "—"}`,
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
    setActionMessage(null);
    try {
      const result = await rejectSlipReview(selectedId, rejectReason.trim());
      setActionMessage(
        `ปฏิเสธสลิปแล้ว — เลขใบเสร็จใหม่ (รอส่งสลิป): ${result.receiptNumber ?? "—"}`,
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
    <div className="bo-review-workspace">
      <ReviewQueuePanel
        title="คิวรอตรวจสลิป"
        count={items.length}
        items={items}
        selectedId={selectedId}
        loading={loading}
        variant="slip"
        emptyTitle="ไม่มีรายการรอตรวจสลิป"
        emptyHint="รอรายการที่นายทะเบียนอนุมัติข้อมูลแล้ว"
        error={error}
        actionMessage={actionMessage}
        showAlerts={!detail}
        onSelect={selectRow}
        onRefresh={() => void reload()}
      />

      <main className="bo-review-main">
        {!detail ? (
          <div className="bo-review-empty">
            <span className="bo-review-empty-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </span>
            <strong>เลือกรายการจากคิว</strong>
            <span>คลิกรายการทางซ้ายเพื่อตรวจสลิปและออกใบเสร็จ</span>
          </div>
        ) : (
          <>
            <ReviewDetailHeader
              stepLabel="ตรวจสลิป · ขั้นที่ 2 เหรัญญิก"
              stepVariant="slip"
              fullName={detail.fullName}
              memberIdLabel="เลขสมาชิก"
              memberId={detail.memberId}
            />

            {error ? <div className="bo-error">{error}</div> : null}

            <div className="bo-review-body">
              <div className="bo-review-info">
                <MemberReviewSummary detail={detail} variant="slip" />
              </div>
              <section className="bo-review-aside bo-review-slip-section">
                <h3 className="bo-review-section-title">สลิปโอนเงิน</h3>
                <SlipImage
                  slipViewUrl={detail.slipViewUrl}
                  emptyHint="ไม่พบรูปสลิป"
                />
              </section>
            </div>

            <ReviewActionBar
              key={detail.memberId}
              busy={busy}
              showReject={showReject}
              rejectReason={rejectReason}
              onApprove={() => void onApprove()}
              onRejectToggle={() => setShowReject((v) => !v)}
              onRejectConfirm={() => void onReject()}
              onRejectReasonChange={setRejectReason}
              approveLabel="ยืนยัน — ออกใบเสร็จตัวจริง"
              rejectPlaceholder="เช่น จำนวนเงินไม่ตรง / สลิปไม่ชัด"
              approveConfirmMessage="ยืนยันสลิปและออกใบเสร็จตัวจริง?"
              approveDisabled={detail.receiptStatus === "official"}
              rejectTextareaId="slip-reject-reason"
              note="เมื่อไม่ผ่าน: สมาชิกยังเป็นสมาชิกสมบูรณ์ (เลขถาวรคงเดิม) · ส่งสลิปใหม่แล้ววนกลับคิวเหรัญญิก"
            />
          </>
        )}
      </main>
    </div>
  );
}
