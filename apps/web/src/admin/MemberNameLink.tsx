/** Clickable member name — opens detail drawer. */
export function MemberNameLink(props: {
  name: string;
  selected?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`bo-name-link${props.selected ? " selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        props.onOpen();
      }}
    >
      {props.name}
    </button>
  );
}

export default MemberNameLink;
