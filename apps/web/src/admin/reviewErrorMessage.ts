const REVIEW_ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่",
  check_failed: "ตรวจสอบเลขไม่สำเร็จ กรุณาลองใหม่",
  approve_failed: "อนุมัติไม่สำเร็จ กรุณาลองใหม่",
  reject_failed: "ปฏิเสธไม่สำเร็จ กรุณาลองใหม่",
  not_found: "ไม่พบสมาชิก",
  member_id_taken:
    "เลขสมาชิกที่จะใช้ถูกใช้ไปแล้ว — กดเปลี่ยนเลขสมาชิกเป็นเลขอื่นก่อนอนุมัติ",
  receipt_number_taken:
    "เลขใบเสร็จที่จะใช้ถูกใช้ไปแล้ว — กดเปลี่ยนเลขใบเสร็จเป็นเลขอื่นก่อนยืนยัน",
  slip_rejected_awaiting_resubmit:
    "สลิปนี้ถูกปฏิเสธแล้ว — รอสมาชิกส่งสลิปใหม่",
};

/** Map raw API / client error codes to Thai copy for review queues. */
export function reviewErrorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : fallback;
  return REVIEW_ERROR_LABEL[code] ?? code;
}
