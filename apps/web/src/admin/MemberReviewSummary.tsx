import type { ReactNode } from "react";
import type { MemberDetail } from "../lib/admin-api";

export interface MemberReviewSummaryProps {
  detail: MemberDetail;
  variant: "data" | "slip";
}

function ReviewField(props: {
  label: string;
  wide?: boolean;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`bo-review-field${props.wide ? " bo-review-field-wide" : ""}${props.highlight ? " bo-review-field-highlight" : ""}`}
    >
      <dt className="bo-review-field-label">{props.label}</dt>
      <dd className="bo-review-field-value">{props.children}</dd>
    </div>
  );
}

function ReviewSection(props: { title: string; children: ReactNode }) {
  return (
    <section className="bo-review-section">
      <h3 className="bo-review-section-title">{props.title}</h3>
      <dl className="bo-review-fields">{props.children}</dl>
    </section>
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

function dataReviewLabel(status?: string): string {
  if (status === "pending") return "รอตรวจ";
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ไม่ผ่าน";
  return status || "—";
}

function receiptStatusLabel(status?: string): string {
  if (status === "official") return "ตัวจริง";
  if (status === "temporary") return "ชั่วคราว";
  if (status === "rejected") return "ถูกปฏิเสธ";
  return status || "—";
}

export default function MemberReviewSummary(props: MemberReviewSummaryProps) {
  const { detail, variant } = props;

  if (variant === "slip") {
    return (
      <div className="bo-review-summary">
        <ReviewSection title="การชำระเงิน">
          <ReviewField label="จำนวนเงิน" highlight>
            {detail.amount != null ? (
              <span className="bo-review-amount">{detail.amount} บาท</span>
            ) : (
              "—"
            )}
          </ReviewField>
          <ReviewField label="ใบเสร็จชั่วคราว">
            {detail.receiptNumber || "—"}
          </ReviewField>
          <ReviewField label="สถานะใบเสร็จ">
            {receiptStatusLabel(detail.receiptStatus)}
            {detail.receiptStatus === "rejected" ? (
              <>
                {" "}
                <span className="bo-badge pending">ถูกปฏิเสธ</span>
              </>
            ) : null}
          </ReviewField>
          <ReviewField label="สถานะการชำระ">
            {detail.paymentStatus || "—"}
          </ReviewField>
        </ReviewSection>

        <ReviewSection title="ตัวตนสมาชิก">
          <ReviewField label="ชื่อ-นามสกุล" wide>
            <strong>{detail.fullName}</strong>
          </ReviewField>
          <ReviewField label="เลขสมาชิก (ถาวร)">
            <code>{detail.memberId}</code>
          </ReviewField>
          {detail.legacyMemberId ? (
            <ReviewField label="เลขสมาชิกเก่า">
              <code>{detail.legacyMemberId}</code>
            </ReviewField>
          ) : null}
          <ReviewField label="ประเภทการสมัคร">
            {linkTypeLabel(detail.linkType)}
          </ReviewField>
        </ReviewSection>

        <ReviewSection title="การติดต่อ">
          <ReviewField label="เบอร์โทร">{detail.phone || "—"}</ReviewField>
          <ReviewField label="อีเมล" wide>
            {detail.email || "—"}
          </ReviewField>
          <ReviewField label="นิติบุคคล" wide>
            {detail.legalEntityName || "—"}
          </ReviewField>
          <ReviewField label="ชื่อตึก / หน่วยงาน" wide>
            {detail.buildingName || detail.organization || "—"}
          </ReviewField>
        </ReviewSection>
      </div>
    );
  }

  return (
    <div className="bo-review-summary">
      <ReviewSection title="ตัวตนสมาชิก">
        <ReviewField label="ชื่อ-นามสกุล" wide>
          <strong>{detail.fullName}</strong>
        </ReviewField>
        {detail.firstName || detail.lastName ? (
          <>
            <ReviewField label="ชื่อ">{detail.firstName || "—"}</ReviewField>
            <ReviewField label="นามสกุล">
              {detail.lastName || "—"}
            </ReviewField>
          </>
        ) : null}
        <ReviewField label="เลขสมาชิกชั่วคราว">
          <code>{detail.memberId}</code>
        </ReviewField>
        {detail.legacyMemberId ? (
          <ReviewField label="เลขสมาชิกเก่า">
            <code>{detail.legacyMemberId}</code>
          </ReviewField>
        ) : null}
        <ReviewField label="ประเภทการสมัคร">
          {linkTypeLabel(detail.linkType)}
        </ReviewField>
      </ReviewSection>

      <ReviewSection title="การติดต่อ">
        <ReviewField label="เบอร์โทร">{detail.phone || "—"}</ReviewField>
        <ReviewField label="อีเมล" wide>
          {detail.email || "—"}
        </ReviewField>
        <ReviewField label="นิติบุคคล" wide>
          {detail.legalEntityName || "—"}
        </ReviewField>
        <ReviewField label="ชื่อตึก / หน่วยงาน" wide>
          {detail.buildingName || detail.organization || "—"}
        </ReviewField>
      </ReviewSection>

      <ReviewSection title="การชำระเงินและสถานะ">
        <ReviewField label="จำนวนเงิน" highlight>
          {detail.amount != null ? (
            <span className="bo-review-amount">{detail.amount} บาท</span>
          ) : (
            "—"
          )}
        </ReviewField>
        <ReviewField label="สถานะตรวจข้อมูล">
          {dataReviewLabel(detail.dataReviewStatus)}
        </ReviewField>
        {detail.expiryDate ? (
          <ReviewField label="วันหมดอายุ">
            {formatDate(detail.expiryDate)}
          </ReviewField>
        ) : null}
        <ReviewField label="วันที่สมัคร">
          {formatDate(detail.createdAt)}
        </ReviewField>
      </ReviewSection>
    </div>
  );
}
