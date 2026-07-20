export interface ReviewDetailHeaderProps {
  stepLabel: string;
  stepVariant: "data" | "slip";
  fullName: string;
  memberIdLabel: string;
  memberId: string;
}

export default function ReviewDetailHeader(props: ReviewDetailHeaderProps) {
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
      <div className="bo-review-header-id">
        <span className="bo-review-header-id-label">{props.memberIdLabel}</span>
        <code>{props.memberId}</code>
      </div>
    </header>
  );
}
