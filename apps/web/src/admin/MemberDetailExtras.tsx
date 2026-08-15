import { useEffect, useState } from "react";
import type { AdminMe, MemberDetail } from "../lib/admin-api";
import { searchLegacyMembersAdmin } from "../lib/admin-api";
import LegacyAttachmentsPanel from "./LegacyAttachmentsPanel";
import LegacyPaymentsPanel from "./LegacyPaymentsPanel";
import MemberDeletePanel from "./MemberDeletePanel";
import MemberProfileEditPanel from "./MemberProfileEditPanel";
import PaymentsHistoryPanel from "./PaymentsHistoryPanel";

export interface MemberDetailExtrasProps {
  detail: MemberDetail;
  me: AdminMe;
  onDeleted: (memberId: string) => void;
  onUpdated?: (member: MemberDetail) => void;
}

export function MemberDetailExtras(props: MemberDetailExtrasProps) {
  return (
    <>
      <MemberProfileEditPanel
        detail={props.detail}
        me={props.me}
        onUpdated={(m) => props.onUpdated?.(m)}
      />
      <PaymentsHistoryPanel memberId={props.detail.memberId} />
      {props.detail.legacyMemberId ? (
        <>
          <BoundLegacyFiles legacyMemberId={props.detail.legacyMemberId} />
          <LegacyPaymentsPanel legacyMemberId={props.detail.legacyMemberId} />
        </>
      ) : null}
      <MemberDeletePanel
        detail={props.detail}
        me={props.me}
        onDeleted={props.onDeleted}
      />
    </>
  );
}

function BoundLegacyFiles(props: { legacyMemberId: string }) {
  const [files, setFiles] = useState<{
    idCardFileUrls?: string[];
    businessRegFileUrls?: string[];
    otherDocumentUrls?: string[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void searchLegacyMembersAdmin({
      q: props.legacyMemberId,
      page: 1,
      pageSize: 50,
    })
      .then((res) => {
        if (cancelled) return;
        const row = res.items.find(
          (item) => item.legacyMemberId === props.legacyMemberId,
        );
        setFiles(
          row
            ? {
                idCardFileUrls: row.idCardFileUrls,
                businessRegFileUrls: row.businessRegFileUrls,
                otherDocumentUrls: row.otherDocumentUrls,
              }
            : null,
        );
      })
      .catch(() => {
        if (!cancelled) setFiles(null);
      });
    return () => {
      cancelled = true;
    };
  }, [props.legacyMemberId]);

  if (!files) return null;
  return <LegacyAttachmentsPanel {...files} />;
}

export default MemberDetailExtras;
