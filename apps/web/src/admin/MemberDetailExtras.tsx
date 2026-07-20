import type { AdminMe, MemberDetail } from "../lib/admin-api";
import LegacyPaymentsPanel from "./LegacyPaymentsPanel";
import MemberDeletePanel from "./MemberDeletePanel";

export interface MemberDetailExtrasProps {
  detail: MemberDetail;
  me: AdminMe;
  onDeleted: (memberId: string) => void;
}

export function MemberDetailExtras(props: MemberDetailExtrasProps) {
  return (
    <>
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
