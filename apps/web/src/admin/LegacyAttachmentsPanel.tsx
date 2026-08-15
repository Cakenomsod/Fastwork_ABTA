import DriveFileCard from "./DriveFileCard";

export type LegacyAttachmentUrls = {
  idCardFileUrls?: string[];
  businessRegFileUrls?: string[];
  otherDocumentUrls?: string[];
};

const GROUPS: Array<{
  key: keyof LegacyAttachmentUrls;
  label: string;
}> = [
  { key: "idCardFileUrls", label: "สำเนาบัตรประชาชน" },
  { key: "businessRegFileUrls", label: "ทะเบียนสถานประกอบการ" },
  { key: "otherDocumentUrls", label: "เอกสารอื่น" },
];

export function LegacyAttachmentsPanel(props: LegacyAttachmentUrls) {
  const groups = GROUPS.map((g) => ({
    ...g,
    urls: (props[g.key] ?? []).filter(Boolean),
  })).filter((g) => g.urls.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="bo-panel-nested">
      <div className="bo-panel-head">
        <h2>ไฟล์แนบจากข้อมูลเก่า</h2>
      </div>
      <div className="bo-legacy-files">
        {groups.map((g) => (
          <section key={g.key} className="bo-legacy-files__group">
            <h3>{g.label}</h3>
            <div className="bo-legacy-files__grid">
              {g.urls.map((url, i) => (
                <DriveFileCard
                  key={`${g.key}-${i}`}
                  url={url}
                  label={`${g.label}${g.urls.length > 1 ? ` ${i + 1}` : ""}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="bo-legacy-files__hint">
        ไฟล์เก็บบน Google Drive ของสมาคม หากรูปไม่ขึ้น ให้เปิดไฟล์ต้นฉบับ
        (อาจต้องลงชื่อเข้าใช้ Drive)
      </p>
    </div>
  );
}

export default LegacyAttachmentsPanel;
