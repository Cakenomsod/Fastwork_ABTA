import type { AdminMe, MemberDetail } from "../lib/admin-api";
import LegacyPaymentsPanel from "./LegacyPaymentsPanel";
import MemberDeletePanel from "./MemberDeletePanel";
import MemberIdsEditor from "./MemberIdsEditor";
import MemberProfileEditor from "./MemberProfileEditor";

export interface MemberDetailExtrasProps {
  detail: MemberDetail;
  me: AdminMe;
  onSaved: (member: MemberDetail) => void;
  onDeleted: (memberId: string) => void;
}

export function MemberDetailExtras(props: MemberDetailExtrasProps) {
  return (
    <>
      <MemberProfileEditor
        detail={props.detail}
        me={props.me}
        onSaved={props.onSaved}
      />
      <MemberIdsEditor
        detail={props.detail}
        me={props.me}
        onSaved={props.onSaved}
      />
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
