import { useEffect, useState } from "react";
import {
  approveDataReview,
  checkIdConflictOnConfirm,
  effectiveIdOnConfirm,
  fetchMemberDetail,
  fetchPendingDataReviews,
  rejectDataReview,
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

export default function DataReviewPage(props: {
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
    if (!detail) {
      setConflictBanner(null);
      return;
    }
    let cancelled = false;
    void checkIdConflictOnConfirm({
      kind: "member",
      current: detail.memberId,
      pending: detail.pendingMemberId,
      exceptMemberId: detail.memberId,
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
        kind: "member",
        current: detail.memberId,
        pending: detail.pendingMemberId,
        exceptMemberId: detail.memberId,
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
      const result = await approveDataReview(selectedId);
      setActionMessage(
        `อนุมัติแล้ว — เลขถาวร: ${result.memberId} · ใบเสร็จชั่วคราว: ${result.receiptNumber ?? "—"}`,
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
      if (code === "member_id_taken" && detail) {
        const conflict = await checkIdConflictOnConfirm({
          kind: "member",
          current: detail.memberId,
          pending: detail.pendingMemberId,
          exceptMemberId: detail.memberId,
        });
        if (conflict) {
          setIdConflict(conflict);
          setConflictBanner(conflict);
          return;
        }
      }
      setError(
        code === "member_id_taken"
          ? "เลขสมาชิกที่จะใช้ถูกใช้ไปแล้ว — กดเปลี่ยนเลขสมาชิกเป็นเลขอื่นก่อนอนุมัติ"
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
        newMemberId: idConflict.suggestedId,
      });
      setDetail(staged.member);
      setItems((prev) =>
        prev.map((row) =>
          row.memberId === staged.memberId
            ? {
                ...row,
                pendingMemberId: staged.member.pendingMemberId,
              }
            : row,
        ),
      );
      setIdConflict(null);
      setConflictBanner(null);
      const result = await approveDataReview(selectedId);
      setActionMessage(
        `อนุมัติแล้ว — เลขถาวร: ${result.memberId} · ใบเสร็จชั่วคราว: ${result.receiptNumber ?? "—"}`,
      );
      setSelectedId(null);
      setDetail(null);
      setShowReject(false);
      await reload();
      props.onChanged?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : "approve_failed";
      setError(
        code === "member_id_taken"
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
      await rejectDataReview(selectedId, rejectReason.trim());
      setActionMessage("ปฏิเสธแล้ว — แจ้งสมาชิกทาง LINE แล้ว");
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
        title="คิวรอตรวจข้อมูล"
        count={items.length}
        items={items}
        selectedId={selectedId}
        loading={loading}
        variant="data"
        emptyTitle="ไม่มีรายการรอตรวจ"
        emptyHint="คิวว่าง — รอใบสมัครใหม่"
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
            <span>คลิกรายการทางซ้ายเพื่อดูข้อมูลสมาชิกและดำเนินการตรวจ</span>
          </div>
        ) : (
          <>
            <ReviewDetailHeader
              stepLabel="ตรวจข้อมูล · ขั้นที่ 1 นายทะเบียน"
              stepVariant="data"
              fullName={detail.fullName}
              memberIdLabel="เลขชั่วคราว"
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
                เลขที่จะได้เมื่อยืนยัน (<code>{conflictBanner.contestedId}</code>
                ) ซ้ำกับสมาชิกที่มีอยู่แล้ว — กดอนุมัติแล้วเลือกระหว่างใช้เลขที่ระบบแนะนำ (
                <code>{conflictBanner.suggestedId}</code>) หรือเปลี่ยนเลขเอง
              </div>
            ) : null}

            <div className="bo-review-body">
              <div className="bo-review-info">
                <MemberReviewSummary
                  detail={detail}
                  variant="data"
                  idChange={
                    <ReviewIdChangePanel
                      me={props.me}
                      detail={detail}
                      mode="member"
                      disabled={busy}
                      openKey={idPanelOpenKey}
                      onUpdated={(result) => {
                        // เลขใหม่ถูกบันทึกเก็บไว้ก่อน — เลขชั่วคราวยังไม่เปลี่ยน
                        setDetail(result.member);
                        setItems((prev) =>
                          prev.map((row) =>
                            row.memberId === result.memberId
                              ? {
                                  ...row,
                                  pendingMemberId:
                                    result.member.pendingMemberId,
                                }
                              : row,
                          ),
                        );
                        setActionMessage(
                          `บันทึกเลขสมาชิกใหม่แล้ว: ${result.member.pendingMemberId ?? "—"} — จะมีผลเมื่อกดอนุมัติ`,
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
                  emptyHint={
                    detail.hasSlip
                      ? "ไม่สามารถแสดงสลิปได้"
                      : "ยังไม่มีสลิป — เหรัญญิกจะตรวจในขั้นที่ 2"
                  }
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
              approveLabel="อนุมัติ — promote + ใบเสร็จชั่วคราว"
              rejectPlaceholder="เช่น ชื่อไม่ตรงกับสลิป / ข้อมูลไม่ครบ"
              approveConfirmMessage={`อนุมัติข้อมูลนี้? เลขสมาชิกถาวรจะเป็น ${effectiveIdOnConfirm(detail.memberId, detail.pendingMemberId)} และออกใบเสร็จชั่วคราว`}
              rejectTextareaId="data-reject-reason"
              note="เมื่อไม่ผ่าน: ไม่ส่งต่อเหรัญญิก · ใบเสร็จยังไม่ออก · สมาชิกแก้ไขแล้ววนกลับคิวนายทะเบียน"
            />

            <ReviewIdConflictDialog
              open={Boolean(idConflict)}
              kind="member"
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
