import type {
  AdminMe,
  DashboardData,
  LegacyPaymentRow,
  MemberDetail,
  QueueItem,
  StaffRow,
} from "./admin-api";

const SESSION_KEY = "abta-dev-admin";


export function isEmbeddedBrowser(): boolean {
  const ua = navigator.userAgent;
  return (
    ua.includes("Cursor") ||
    ua.includes("Electron") ||
    /WebView|wv\)/i.test(ua)
  );
}


export function endDevAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export const DEV_ADMIN_ME: AdminMe = {
  email: "dev@localhost",
  displayName: "Dev Admin",
  roles: ["admin", "registrar", "treasurer"],
  isSuperAdmin: true,
  canManageStaff: true,
};

const MOCK_QUEUE: QueueItem[] = [
  {
    memberId: "ABTA-T-2026-0042",
    tempMemberId: "ABTA-T-2026-0042",
    fullName: "สมชาย ใจดี",
    phone: "0812345678",
    email: "somchai@example.com",
    legalEntityName: "บริษัท ตัวอย่าง จำกัด",
    buildingName: "อาคาร ABTA Tower",
    linkType: "new",
    status: "temporary",
    dataReviewStatus: "pending",
    createdAt: "2026-07-18T10:30:00.000Z",
    updatedAt: "2026-07-19T14:20:00.000Z",
    hasSlip: true,
  },
  {
    memberId: "ABTA-T-2026-0043",
    tempMemberId: "ABTA-T-2026-0043",
    fullName: "วิไล รักเรียน",
    phone: "0898765432",
    legalEntityName: "ห้างหุ้นส่วนจำกัด วิไลดีไซน์",
    buildingName: "Central Plaza",
    linkType: "legacy",
    status: "temporary",
    dataReviewStatus: "approved",
    paymentId: "pay-0043",
    amount: 500,
    receiptNumber: "R-T-2026-0043",
    receiptStatus: "temp",
    paymentStatus: "slip_review",
    createdAt: "2026-07-17T08:15:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    hasSlip: true,
  },
  {
    memberId: "ABTA-2025-1045",
    fullName: "ประเสริฐ มั่นคง",
    phone: "0623456789",
    legalEntityName: "บริษัท ประเสริฐ กรุ๊ป จำกัด",
    status: "active",
    dataReviewStatus: "approved",
    receiptStatus: "official",
    paymentStatus: "official_receipt_issued",
    verifiedAt: "2026-07-15T11:00:00.000Z",
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2026-07-15T11:00:00.000Z",
    hasSlip: false,
  },
];

const MOCK_MEMBER_DETAILS: Record<string, MemberDetail> = Object.fromEntries(
  MOCK_QUEUE.map((item) => [
    item.memberId,
    {
      ...item,
      firstName: item.fullName.split(" ")[0],
      lastName: item.fullName.split(" ").slice(1).join(" "),
      organization: item.legalEntityName,
      expiryDate: "2027-06-30",
      slipViewUrl:
        item.hasSlip
          ? "https://placehold.co/480x720/e8f5ee/1a5c3a?text=Mock+Slip"
          : undefined,
      memberCardUrl: "/card?m=mock",
    },
  ]),
);

export function devAdminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  void init;
  const url = new URL(path, "http://local");
  const memberId = url.searchParams.get("memberId") ?? "";
  const query = url.searchParams.get("q") ?? "";

  if (path.startsWith("/admin/me")) {
    return Promise.resolve({ me: DEV_ADMIN_ME } as T);
  }

  if (path.startsWith("/admin/dashboard")) {
    const dashboard: DashboardData = {
      totalMembers: 128,
      pendingDataReviews: MOCK_QUEUE.filter(
        (i) => i.dataReviewStatus === "pending",
      ).length,
      pendingSlipReviews: MOCK_QUEUE.filter((i) => i.hasSlip && i.receiptStatus === "pending")
        .length,
      activeMembers: 96,
      temporaryMembers: 12,
      recent: MOCK_QUEUE,
    };
    return Promise.resolve(dashboard as T);
  }

  if (path.startsWith("/admin/reviews/data")) {
    return Promise.resolve({
      items: MOCK_QUEUE.filter((i) => i.dataReviewStatus === "pending"),
    } as T);
  }

  if (path.startsWith("/admin/reviews/slips")) {
    return Promise.resolve({
      items: MOCK_QUEUE.filter((i) => i.hasSlip && i.receiptStatus === "pending"),
    } as T);
  }

  if (path.startsWith("/admin/members/detail")) {
    const member = MOCK_MEMBER_DETAILS[memberId] ?? MOCK_MEMBER_DETAILS["ABTA-T-2026-0042"];
    return Promise.resolve({ member } as T);
  }

  if (path.startsWith("/admin/members/search")) {
    const q = query.trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const memberIdT = url.searchParams.get("memberIdT") ?? "";
    const sort = url.searchParams.get("sort") ?? "updated_desc";

    if (!q && !status && !memberIdT && !url.searchParams.get("sort")) {
      return Promise.resolve({ items: [] } as T);
    }

    let items = [...MOCK_QUEUE];
    if (q) {
      items = items.filter(
        (i) =>
          i.memberId.toLowerCase().includes(q) ||
          i.fullName.toLowerCase().includes(q) ||
          (i.legalEntityName ?? "").toLowerCase().includes(q),
      );
    }
    if (memberIdT === "with_t") {
      items = items.filter((i) => /T/i.test(i.memberId));
    } else if (memberIdT === "without_t") {
      items = items.filter((i) => !/T/i.test(i.memberId));
    }
    function displayStatus(i: QueueItem): string {
      if (i.dataReviewStatus === "pending") return "pending_data";
      const awaitingSlip =
        i.dataReviewStatus !== "rejected" &&
        (i.paymentStatus === "slip_review" ||
          ((i.receiptStatus === "temp" ||
            i.receiptStatus === "pending_review" ||
            i.receiptStatus === "rejected") &&
            i.dataReviewStatus === "approved"));
      if (awaitingSlip) return "pending_slip";
      if (i.status === "active") return "active";
      if (i.status === "temporary") return "temporary";
      return "other";
    }

    if (status) {
      items = items.filter((i) => displayStatus(i) === status);
    }

    items.sort((a, b) => {
      const hasT = (id: string) => (/T/i.test(id) ? 0 : 1);
      const cmpId = (x: string, y: string) => x.localeCompare(y, "en");
      switch (sort) {
        case "member_asc":
          return cmpId(a.memberId, b.memberId);
        case "member_desc":
          return cmpId(b.memberId, a.memberId);
        case "t_first": {
          const d = hasT(a.memberId) - hasT(b.memberId);
          return d !== 0 ? d : cmpId(a.memberId, b.memberId);
        }
        case "no_t_first": {
          const d = hasT(b.memberId) - hasT(a.memberId);
          return d !== 0 ? d : cmpId(a.memberId, b.memberId);
        }
        case "confirmed_desc":
          return (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? "");
        case "updated_desc":
        default:
          return (b.updatedAt ?? b.createdAt ?? "").localeCompare(
            a.updatedAt ?? a.createdAt ?? "",
          );
      }
    });

    return Promise.resolve({ items } as T);
  }

  if (path.startsWith("/admin/members/ids/check")) {
    return Promise.resolve({
      memberId: {
        value: url.searchParams.get("memberId") ?? "",
        validFormat: true,
        available: true,
      },
      suggest: {
        nextTempMemberId: "T-2026-0099",
        nextPermanentMemberId: "A-1099",
        nextTempReceiptNumber: "R-T-2026-0099",
        nextOfficialReceiptNumber: "R-2026-0099",
      },
    } as T);
  }

  if (path.startsWith("/admin/members/legacy-payments")) {
    const rows: LegacyPaymentRow[] = [
      {
        receiptNumber: "R-2024-0156",
        amount: 500,
        item: "ค่าสมาชิก",
        expiryDate: "2025-06-30",
        transferredAt: "2024-07-01",
      },
    ];
    return Promise.resolve({ items: rows } as T);
  }

  if (path.startsWith("/admin/staff")) {
    const staff: StaffRow[] = [
      {
        email: "dev@localhost",
        roles: ["admin", "registrar", "treasurer"],
        isSuperAdmin: true,
        displayName: "Dev Admin",
      },
      {
        email: "registrar@example.com",
        roles: ["registrar"],
        isSuperAdmin: false,
        displayName: "นายทะเบียน ตัวอย่าง",
      },
    ];
    if (init?.method === "GET") {
      return Promise.resolve({ staff } as T);
    }
    return Promise.resolve({ staff: staff[0] } as T);
  }

  if (
    path.startsWith("/admin/reviews/") ||
    path.startsWith("/admin/members")
  ) {
    const member = MOCK_MEMBER_DETAILS[memberId] ?? MOCK_MEMBER_DETAILS["ABTA-T-2026-0042"];
    return Promise.resolve({
      memberId: member.memberId,
      receiptNumber: member.receiptNumber,
      member,
    } as T);
  }

  return Promise.reject(new Error(`dev_admin_mock_missing:${path}`));
}
