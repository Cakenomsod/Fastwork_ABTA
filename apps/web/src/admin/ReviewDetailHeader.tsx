export interface ReviewDetailHeaderProps {
  stepLabel: string;
  stepVariant: "data" | "slip";
  fullName: string;
  memberIdLabel: string;
  memberId: string;
  /** Permanent / official ID that will apply on approve — omit or blank when unknown. */
  effectiveIdLabel?: string;
  effectiveId?: string;
  /** Highlight effective ID when it differs from the current/temp ID. */
  effectiveIdHighlight?: boolean;
}

export default function ReviewDetailHeader(props: ReviewDetailHeaderProps) {
  const effectiveId = props.effectiveId?.trim() ?? "";
  const showEffective = Boolean(props.effectiveIdLabel && effectiveId);

  return (
    <header className="bo-review-header">
      <div className="bo-review-header-main">
        <span
          className={`bo-review-step bo-review-step-${props.stepVariant}`}
        >
          {props.stepLabel}
        </span>
        <h2>{props.fullName}</h2>
      </div>
      <div className="bo-review-header-ids">
        <div className="bo-review-header-id">
          <span className="bo-review-header-id-label">{props.memberIdLabel}</span>
          <code>{props.memberId}</code>
        </div>
        {showEffective ? (
          <div
            className={`bo-review-header-id bo-review-header-id-effective${
              props.effectiveIdHighlight ? " is-highlight" : ""
            }`}
          >
            <span className="bo-review-header-id-label">
              {props.effectiveIdLabel}
            </span>
            <code>{effectiveId}</code>
          </div>
        ) : null}
      </div>
    </header>
  );
}
