export function receiptPrintPath(paymentId: string, autoPrint = false): string {
  const base = `/admin/receipts/print?paymentId=${encodeURIComponent(paymentId)}`;
  return autoPrint ? `${base}&print=1` : base;
}

export function openReceiptPrint(paymentId: string, autoPrint = false): void {
  window.open(
    receiptPrintPath(paymentId, autoPrint),
    "_blank",
    "noopener,noreferrer",
  );
}
