import { useEffect, useMemo, useState } from "react";
import {
  canEditMemberNumber,
  canEditReceiptNumber,
  checkMemberIds,
  updateMemberIds,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";

const MEMBER_ID_RE = /^ABTA(?:-T)?-\d{4}-\d{4}$/;
const RECEIPT_RE = /^RC(?:-T)?-\d{4}-\d{4}$/;

const ERROR_LABEL: Record<string, string> = {
  invalid_member_id_format:
    "รูปแบบเลขสมาชิกไม่ถูกต้อง (เช่น ABTA-2026-0001 หรือ ABTA-T-2026-0001)",
  invalid_receipt_number_format:
    "รูปแบบเลขใบเสร็จไม่ถูกต้อง (เช่น RC-2026-0001 หรือ RC-T-2026-0001)",
  member_id_taken: "เลขสมาชิกนี้ถูกใช้แล้ว หรือถูกจองในระบบ",
  receipt_number_taken: "เลขใบเสร็จนี้ถูกใช้แล้ว หรือถูกจองในระบบ",
  forbidden_role: "บทบาทของคุณไม่มีสิทธิ์แก้ไขฟิลด์นี้",
  payment_not_found: "ยังไม่มีข้อมูลการชำระ — แก้เลขใบเสร็จไม่ได้",
  nothing_to_update: "ไม่มีค่าที่ต้องบันทึก",
  not_found: "ไม่พบสมาชิก",
  id_update_conflict: "บันทึกไม่สำเร็จ — อาจมีคนแก้เลขพร้อมกัน กรุณาลองใหม่",
};

export default function MemberIdsEditor(props: {
  detail: MemberDetail;
  me: AdminMe;
  onSaved: (member: MemberDetail) => void;
}) {
  const canMember = canEditMemberNumber(props.me);
  const canReceipt = canEditReceiptNumber(props.me);

  const [memberIdDraft, setMemberIdDraft] = useState(props.detail.memberId);
  const [receiptDraft, setReceiptDraft] = useState(
    props.detail.receiptNumber ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [memberAvail, setMemberAvail] = useState<boolean | null>(null);
  const [receiptAvail, setReceiptAvail] = useState<boolean | null>(null);
  const [suggest, setSuggest] = useState<{
    nextTempMemberId: string;
    nextPermanentMemberId: string;
    nextTempReceiptNumber: string;
    nextOfficialReceiptNumber: string;
  } | null>(null);

  useEffect(() => {
    setMemberIdDraft(props.detail.memberId);
    setReceiptDraft(props.detail.receiptNumber ?? "");
    setError(null);
    setOkMsg(null);
    setMemberAvail(null);
    setReceiptAvail(null);
  }, [props.detail.memberId, props.detail.receiptNumber]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await checkMemberIds({
          exceptMemberId: props.detail.memberId,
          exceptPaymentId: props.detail.paymentId,
        });
        if (!cancelled) setSuggest(result.suggest);
      } catch {
        // hints are optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.detail.memberId, props.detail.paymentId]);

  const memberDirty = memberIdDraft.trim() !== props.detail.memberId;
  const receiptDirty =
    receiptDraft.trim() !== (props.detail.receiptNumber ?? "");
  const dirty = (canMember && memberDirty) || (canReceipt && receiptDirty);

  const memberFormatOk = useMemo(() => {
    if (!memberDirty) return true;
    return MEMBER_ID_RE.test(memberIdDraft.trim());
  }, [memberDirty, memberIdDraft]);

  const receiptFormatOk = useMemo(() => {
    if (!receiptDirty) return true;
    return RECEIPT_RE.test(receiptDraft.trim());
  }, [receiptDirty, receiptDraft]);

  useEffect(() => {
    if (!dirty) {
      setMemberAvail(null);
      setReceiptAvail(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        setChecking(true);
        try {
          const result = await checkMemberIds({
            memberId: canMember && memberDirty ? memberIdDraft.trim() : undefined,
            receiptNumber:
              canReceipt && receiptDirty ? receiptDraft.trim() : undefined,
            exceptMemberId: props.detail.memberId,
            exceptPaymentId: props.detail.paymentId,
          });
          setSuggest(result.suggest);
          setMemberAvail(
            result.memberId ? result.memberId.available : null,
          );
          setReceiptAvail(
            result.receiptNumber ? result.receiptNumber.available : null,
          );
        } catch {
          setMemberAvail(null);
          setReceiptAvail(null);
        } finally {
          setChecking(false);
        }
      })();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    dirty,
    memberDirty,
    receiptDirty,
    memberIdDraft,
    receiptDraft,
    canMember,
    canReceipt,
    props.detail.memberId,
    props.detail.paymentId,
  ]);

  if (!canMember && !canReceipt) return null;

  const memberLabel =
    props.detail.status === "temporary" ||
    props.detail.memberId.startsWith("ABTA-T-")
      ? "เลขสมาชิกชั่วคราว"
      : "เลขสมาชิก";

  const receiptLabel =
    props.detail.receiptStatus === "official"
      ? "เลขใบเสร็จตัวจริง"
      : props.detail.receiptNumber
        ? "เลขใบเสร็จ"
        : "เลขใบเสร็จ (ยังไม่ออก)";

  const blockedByAvailability =
    (memberDirty && memberAvail === false) ||
    (receiptDirty && receiptAvail === false) ||
    (memberDirty && !memberFormatOk) ||
    (receiptDirty && !receiptFormatOk);

  async function onSave() {
    setError(null);
    setOkMsg(null);

    const payload: {
      memberId: string;
      newMemberId?: string;
      newReceiptNumber?: string;
    } = { memberId: props.detail.memberId };

    if (canMember && memberDirty) {
      const v = memberIdDraft.trim();
      if (!v) {
        setError("เลขสมาชิกต้องไม่ว่าง");
        return;
      }
      if (!MEMBER_ID_RE.test(v)) {
        setError(ERROR_LABEL.invalid_member_id_format);
        return;
      }
      payload.newMemberId = v;
    }

    if (canReceipt && receiptDirty) {
      const v = receiptDraft.trim();
      if (!v) {
        setError("เลขใบเสร็จต้องไม่ว่าง");
        return;
      }
      if (!RECEIPT_RE.test(v)) {
        setError(ERROR_LABEL.invalid_receipt_number_format);
        return;
      }
      payload.newReceiptNumber = v;
    }

    if (!payload.newMemberId && !payload.newReceiptNumber) {
      setError("ไม่มีค่าที่เปลี่ยน");
      return;
    }

    const changes: string[] = [];
    if (payload.newMemberId) {
      changes.push(
        `เลขสมาชิก: ${props.detail.memberId} → ${payload.newMemberId}`,
      );
    }
    if (payload.newReceiptNumber) {
      changes.push(
        `เลขใบเสร็จ: ${props.detail.receiptNumber ?? "—"} → ${payload.newReceiptNumber}`,
      );
    }
    const confirmed = window.confirm(
      `ยืนยันแก้ไขเลข?\n\n${changes.join("\n")}\n\nระบบจะกันเลขชนและเลื่อนรันเลขอัตโนมัติให้ไม่ชนกับเลขที่ตั้งเอง`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const result = await updateMemberIds(payload);
      setOkMsg("บันทึกแล้ว — อัปเดต registry + รันเลขแล้ว");
      setMemberAvail(null);
      setReceiptAvail(null);
      props.onSaved(result.member);
    } catch (err) {
      const code = err instanceof Error ? err.message : "save_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setBusy(false);
    }
  }

  function applySuggestedMember(id: string) {
    setMemberIdDraft(id);
  }

  function applySuggestedReceipt(id: string) {
    setReceiptDraft(id);
  }

  return (
    <div className="bo-ids-editor">
      <h4>แก้ไขเลขสมาชิก / ใบเสร็จ</h4>
      <p className="bo-field-hint">
        การแก้เลขจะตรวจซ้ำแบบ transaction และเลื่อนรันเลขปีนั้นให้อยู่เหนือเลขที่ตั้งเอง
        เพื่อกันชนกับเลขที่ระบบออกอัตโนมัติ
      </p>
      <div className="bo-form-grid">
        {canMember ? (
          <div className="bo-field">
            <label htmlFor={`bo-member-id-${props.detail.memberId}`}>
              {memberLabel}
            </label>
            <input
              id={`bo-member-id-${props.detail.memberId}`}
              value={memberIdDraft}
              onChange={(e) => setMemberIdDraft(e.target.value.toUpperCase())}
              spellCheck={false}
              autoComplete="off"
              placeholder="ABTA-2026-0001"
              aria-invalid={memberDirty && (!memberFormatOk || memberAvail === false)}
            />
            {props.detail.tempMemberId &&
            props.detail.tempMemberId !== props.detail.memberId ? (
              <p className="bo-field-hint">
                เลขชั่วคราวเดิม: <code>{props.detail.tempMemberId}</code>
              </p>
            ) : null}
            {memberDirty && !memberFormatOk ? (
              <p className="bo-field-warn">รูปแบบไม่ถูกต้อง</p>
            ) : null}
            {memberDirty && memberFormatOk && memberAvail === false ? (
              <p className="bo-field-warn">เลขนี้ถูกใช้แล้ว</p>
            ) : null}
            {memberDirty && memberFormatOk && memberAvail === true ? (
              <p className="bo-field-ok">เลขนี้ใช้ได้</p>
            ) : null}
            {suggest && canMember ? (
              <p className="bo-field-hint bo-id-suggest">
                รันถัดไป:{" "}
                <button
                  type="button"
                  className="bo-linkish"
                  onClick={() =>
                    applySuggestedMember(suggest.nextPermanentMemberId)
                  }
                >
                  {suggest.nextPermanentMemberId}
                </button>
                {" · "}
                <button
                  type="button"
                  className="bo-linkish"
                  onClick={() => applySuggestedMember(suggest.nextTempMemberId)}
                >
                  {suggest.nextTempMemberId}
                </button>
              </p>
            ) : null}
          </div>
        ) : null}

        {canReceipt ? (
          <div className="bo-field">
            <label htmlFor={`bo-receipt-${props.detail.memberId}`}>
              {receiptLabel}
            </label>
            <input
              id={`bo-receipt-${props.detail.memberId}`}
              value={receiptDraft}
              onChange={(e) => setReceiptDraft(e.target.value.toUpperCase())}
              spellCheck={false}
              autoComplete="off"
              placeholder="RC-T-2026-0001"
              disabled={!props.detail.paymentId && !props.detail.receiptNumber}
              aria-invalid={
                receiptDirty && (!receiptFormatOk || receiptAvail === false)
              }
            />
            {!props.detail.paymentId && !props.detail.receiptNumber ? (
              <p className="bo-field-hint">
                ยังไม่มีรายการชำระ — แก้เลขใบเสร็จไม่ได้
              </p>
            ) : null}
            {receiptDirty && !receiptFormatOk ? (
              <p className="bo-field-warn">รูปแบบไม่ถูกต้อง</p>
            ) : null}
            {receiptDirty && receiptFormatOk && receiptAvail === false ? (
              <p className="bo-field-warn">เลขนี้ถูกใช้แล้ว</p>
            ) : null}
            {receiptDirty && receiptFormatOk && receiptAvail === true ? (
              <p className="bo-field-ok">เลขนี้ใช้ได้</p>
            ) : null}
            {suggest && canReceipt ? (
              <p className="bo-field-hint bo-id-suggest">
                รันถัดไป:{" "}
                <button
                  type="button"
                  className="bo-linkish"
                  onClick={() =>
                    applySuggestedReceipt(suggest.nextOfficialReceiptNumber)
                  }
                >
                  {suggest.nextOfficialReceiptNumber}
                </button>
                {" · "}
                <button
                  type="button"
                  className="bo-linkish"
                  onClick={() =>
                    applySuggestedReceipt(suggest.nextTempReceiptNumber)
                  }
                >
                  {suggest.nextTempReceiptNumber}
                </button>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="bo-error">{error}</div> : null}
        {okMsg ? <div className="bo-ok">{okMsg}</div> : null}
        {checking ? (
          <p className="bo-field-hint">กำลังตรวจเลขซ้ำ…</p>
        ) : null}

        <button
          type="button"
          className="bo-btn bo-btn-primary"
          disabled={busy || !dirty || blockedByAvailability}
          onClick={() => void onSave()}
        >
          {busy ? "กำลังบันทึก…" : "บันทึกเลข"}
        </button>
      </div>
    </div>
  );
}
