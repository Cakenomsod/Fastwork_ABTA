import { useEffect, useState } from "react";
import {
  fetchAdminReceiptDetail,
  type AdminReceiptDetail,
} from "../../lib/admin-api";
import { ReceiptDocument } from "../../pages/ReceiptPage";
import "../../pages/receipt.css";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; data: AdminReceiptDetail };

function wantsAutoPrint(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("print") === "1";
}

export default function AdminReceiptPrintPage() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const autoPrint = wantsAutoPrint();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId")?.trim();
    if (!paymentId) {
      setState({ phase: "error", message: "ไม่พบรหัสรายการชำระเงิน" });
      return;
    }

    void fetchAdminReceiptDetail(paymentId)
      .then((data) => setState({ phase: "ready", data }))
      .catch((err: Error) =>
        setState({
          phase: "error",
          message:
            err.message === "not_found"
              ? "ไม่พบใบเสร็จสำหรับรายการนี้"
              : "โหลดใบเสร็จไม่สำเร็จ",
        }),
      );
  }, []);

  if (state.phase === "loading") {
    return (
      <div className="rcpt-shell">
        <main className="rcpt-wrap">
          <p className="rcpt-lead">กำลังโหลดใบเสร็จ…</p>
        </main>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="rcpt-shell">
        <main className="rcpt-wrap">
          <div className="rcpt-error">
            <h1>{state.message}</h1>
            <a className="rcpt-error__btn" href="/admin/receipts">
              ← กลับไปค้นหาใบเสร็จ
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="rcpt-shell rcpt-shell--admin">
      <div className="rcpt-atmosphere no-print" aria-hidden />
      <main className="rcpt-wrap">
        <ReceiptDocument
          data={state.data}
          backHref="/admin/receipts"
          autoPrint={autoPrint}
        />
      </main>
    </div>
  );
}
