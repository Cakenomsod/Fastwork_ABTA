import type { AdminMe, MemberDetail } from "../lib/admin-api";
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
        <LegacyPaymentsPanel legacyMemberId={props.detail.legacyMemberId} />
      ) : null}
      <MemberDeletePanel
        detail={props.detail}
        me={props.me}
        onDeleted={props.onDeleted}
      />
    </>
  );
}

export default MemberDetailExtras;
