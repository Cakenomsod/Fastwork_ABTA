import { useEffect, useState } from "react";
import {
  approveSlipReview,
  checkIdConflictOnConfirm,
  effectiveIdOnConfirm,
  fetchMemberDetail,
  fetchPendingSlipReviews,
  rejectSlipReview,
  updateMemberIds,
  type AdminMe,
  type IdConflictCheck,
  type MemberDetail,
  type QueueItem,
} from "../../lib/admin-api";
import MemberReviewSummary from "../MemberReviewSummary";
import ReviewActionBar from "../ReviewActionBar";
import ReviewDetailHeader from "../ReviewDetailHeader";
import ReviewIdChangePanel from "../ReviewIdChangePanel";
import ReviewIdConflictDialog from "../ReviewIdConflictDialog";
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
  const [idConflict, setIdConflict] = useState<IdConflictCheck | null>(null);
  const [conflictBanner, setConflictBanner] = useState<IdConflictCheck | null>(
    null,
  );
  const [idPanelOpenKey, setIdPanelOpenKey] = useState(0);

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
      setConflictBanner(null);
      setIdConflict(null);
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

  useEffect(() => {
    if (!detail?.receiptNumber) {
      setConflictBanner(null);
      return;
    }
    let cancelled = false;
    void checkIdConflictOnConfirm({
      kind: "receipt",
      current: detail.receiptNumber,
      pending: detail.pendingReceiptNumber,
      exceptMemberId: detail.memberId,
      exceptPaymentId: detail.paymentId,
    }).then((conflict) => {
      if (!cancelled) setConflictBanner(conflict);
    });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  function selectRow(memberId: string) {
    setSelectedId(memberId);
    setShowReject(false);
    setRejectReason("");
    setActionMessage(null);
    setError(null);
    setIdConflict(null);
  }

  async function gateApprove(): Promise<boolean> {
    if (!detail) return false;
    setError(null);
    try {
      const conflict = await checkIdConflictOnConfirm({
        kind: "receipt",
        current: detail.receiptNumber,
        pending: detail.pendingReceiptNumber,
        exceptMemberId: detail.memberId,
        exceptPaymentId: detail.paymentId,
      });
      if (conflict) {
        setConflictBanner(conflict);
        setIdConflict(conflict);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "check_failed");
      return false;
    }
  }

  async function runApprove() {
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
      setIdConflict(null);
      setConflictBanner(null);
      await reload();
      props.onChanged?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : "approve_failed";
      if (code === "receipt_number_taken" && detail) {
        const conflict = await checkIdConflictOnConfirm({
          kind: "receipt",
          current: detail.receiptNumber,
          pending: detail.pendingReceiptNumber,
          exceptMemberId: detail.memberId,
          exceptPaymentId: detail.paymentId,
        });
        if (conflict) {
          setIdConflict(conflict);
          setConflictBanner(conflict);
          return;
        }
      }
      setError(
        code === "receipt_number_taken"
          ? "เลขใบเสร็จที่จะใช้ถูกใช้ไปแล้ว — กดเปลี่ยนเลขใบเสร็จเป็นเลขอื่นก่อนยืนยัน"
          : code,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onUseSuggestedId() {
    if (!selectedId || !idConflict) return;
    setBusy(true);
    setError(null);
    try {
      const staged = await updateMemberIds({
        memberId: selectedId,
        newReceiptNumber: idConflict.suggestedId,
      });
      setDetail(staged.member);
      setItems((prev) =>
        prev.map((row) =>
          row.memberId === staged.memberId
            ? {
                ...row,
                pendingReceiptNumber: staged.member.pendingReceiptNumber,
              }
            : row,
        ),
      );
      setIdConflict(null);
      setConflictBanner(null);
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
      const code = err instanceof Error ? err.message : "approve_failed";
      setError(
        code === "receipt_number_taken"
          ? "เลขที่ระบบแนะนำถูกใช้ไปแล้ว — ลองเปลี่ยนเลขเอง"
          : code,
      );
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
      setIdConflict(null);
      setConflictBanner(null);
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
            {actionMessage && detail ? (
              <div className="bo-flash-ok" role="status">
                {actionMessage}
              </div>
            ) : null}
            {conflictBanner ? (
              <div className="bo-flash-warn" role="alert">
                เลขใบเสร็จที่จะได้เมื่อยืนยัน (
                <code>{conflictBanner.contestedId}</code>) ซ้ำกับที่มีอยู่แล้ว —
                กดยืนยันแล้วเลือกระหว่างใช้เลขที่ระบบแนะนำ (
                <code>{conflictBanner.suggestedId}</code>) หรือเปลี่ยนเลขเอง
              </div>
            ) : null}

            <div className="bo-review-body">
              <div className="bo-review-info">
                <MemberReviewSummary
                  detail={detail}
                  variant="slip"
                  idChange={
                    <ReviewIdChangePanel
                      me={props.me}
                      detail={detail}
                      mode="receipt"
                      disabled={busy}
                      openKey={idPanelOpenKey}
                      onUpdated={(result) => {
                        // เลขใหม่ถูกบันทึกเก็บไว้ก่อน — ใบเสร็จชั่วคราวยังไม่เปลี่ยน
                        setDetail(result.member);
                        setItems((prev) =>
                          prev.map((row) =>
                            row.memberId === result.memberId
                              ? {
                                  ...row,
                                  pendingReceiptNumber:
                                    result.member.pendingReceiptNumber,
                                }
                              : row,
                          ),
                        );
                        setActionMessage(
                          `บันทึกเลขใบเสร็จใหม่แล้ว: ${result.member.pendingReceiptNumber ?? "—"} — จะมีผลเมื่อกดยืนยัน`,
                        );
                        setError(null);
                        setIdConflict(null);
                        props.onChanged?.();
                      }}
                    />
                  }
                />
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
              gateApprove={gateApprove}
              onApprove={() => void runApprove()}
              onRejectToggle={() => setShowReject((v) => !v)}
              onRejectConfirm={() => void onReject()}
              onRejectReasonChange={setRejectReason}
              approveLabel="ยืนยัน — ออกใบเสร็จตัวจริง"
              rejectPlaceholder="เช่น จำนวนเงินไม่ตรง / สลิปไม่ชัด"
              approveConfirmMessage={`ยืนยันสลิป? ใบเสร็จตัวจริงจะใช้เลข ${effectiveIdOnConfirm(detail.receiptNumber, detail.pendingReceiptNumber)}`}
              approveDisabled={detail.receiptStatus === "official"}
              rejectTextareaId="slip-reject-reason"
              note="เมื่อไม่ผ่าน: สมาชิกยังเป็นสมาชิกสมบูรณ์ (เลขถาวรคงเดิม) · ส่งสลิปใหม่แล้ววนกลับคิวเหรัญญิก"
            />

            <ReviewIdConflictDialog
              open={Boolean(idConflict)}
              kind="receipt"
              tempId={idConflict?.tempId ?? ""}
              contestedId={idConflict?.contestedId ?? ""}
              suggestedId={idConflict?.suggestedId ?? ""}
              busy={busy}
              onUseSuggested={() => void onUseSuggestedId()}
              onChangeManually={() => {
                setIdConflict(null);
                setIdPanelOpenKey((k) => k + 1);
              }}
              onCancel={() => setIdConflict(null)}
            />
          </>
        )}
      </main>
    </div>
  );
}
