import { useEffect, useState } from "react";
import { apiBase } from "../lib/api";
import { ADMIN_OPEN_ACCESS } from "../lib/admin-open-access";
import { getIdToken } from "../lib/firebase";

/**
 * Loads an admin slip via authenticated fetch (Bearer token).
 * Plain img elements cannot send Authorization headers.
 */
export default function SlipImage(props: {
  slipViewUrl?: string;
  alt?: string;
  emptyHint?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setError(false);
      setSrc(null);
      const url = props.slipViewUrl;
      if (!url) return;

      if (url.startsWith("http://") || url.startsWith("https://")) {
        if (!cancelled) setSrc(url);
        return;
      }

      try {
        const token = await getIdToken();
        if (!token && !ADMIN_OPEN_ACCESS) {
          if (!cancelled) setError(true);
          return;
        }
        const res = await fetch(`${apiBase()}/api${url}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [props.slipViewUrl]);

  if (!props.slipViewUrl) {
    return <SlipEmpty text={props.emptyHint || "ยังไม่มีสลิป"} />;
  }

  if (error) {
    return <SlipEmpty text="ไม่สามารถแสดงสลิปได้" />;
  }

  if (!src) {
    return <SlipEmpty text="กำลังโหลดสลิป…" />;
  }

  return (
    <figure className="bo-slip-frame">
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={props.alt || "สลิปโอนเงิน"} />
      </a>
      <figcaption>คลิกที่รูปเพื่อเปิดขนาดเต็ม</figcaption>
    </figure>
  );
}

function SlipEmpty(props: { text: string }) {
  return (
    <div className="bo-slip-empty">
      <span className="bo-slip-empty-icon" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </span>
      <span>{props.text}</span>
    </div>
  );
}
