import { useEffect, useState } from "react";
import { apiBase } from "../lib/api";
import { getIdToken } from "../lib/firebase";

/**
 * Loads an admin slip via authenticated fetch (Bearer token).
 * Plain <img src> cannot send Authorization headers.
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
        if (!token) {
          if (!cancelled) setError(true);
          return;
        }
        const res = await fetch(`${apiBase()}/api${url}`, {
          headers: { Authorization: `Bearer ${token}` },
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
    return (
      <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
        {props.emptyHint || "ยังไม่มีสลิป"}
      </span>
    );
  }

  if (error) {
    return (
      <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
        ไม่สามารถแสดงสลิปได้
      </span>
    );
  }

  if (!src) {
    return (
      <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
        กำลังโหลดสลิป…
      </span>
    );
  }

  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt={props.alt || "สลิปโอนเงิน"} />
    </a>
  );
}
