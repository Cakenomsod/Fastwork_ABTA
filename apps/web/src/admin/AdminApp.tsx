import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAdminMe,
  fetchDashboard,
  canSendBroadcast,
  canCreateMember,
  type AdminMe,
  type DashboardData,
  type StaffRole,
  ROLE_LABEL,
} from "../lib/admin-api";
import { ADMIN_OPEN_ACCESS } from "../lib/admin-open-access";
import {
  initAuth,
  signInWithGoogle,
  signOutAdmin,
} from "../lib/firebase";
import type { User } from "firebase/auth";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DataReviewPage = lazy(() => import("./pages/DataReviewPage"));
const SlipReviewPage = lazy(() => import("./pages/SlipReviewPage"));
const LegacyMembersPage = lazy(() => import("./pages/LegacyMembersPage"));
const LegacyImportPage = lazy(() => import("./pages/LegacyImportPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const SeminarsPage = lazy(() => import("./pages/SeminarsPage"));
const BroadcastPage = lazy(() => import("./pages/BroadcastPage"));
const MessageTemplatesPage = lazy(
  () => import("./pages/MessageTemplatesPage"),
);
const AgmReportPage = lazy(() => import("./pages/AgmReportPage"));
const ReceiptsPage = lazy(() => import("./pages/ReceiptsPage"));
const CreateMemberPage = lazy(() => import("./pages/CreateMemberPage"));
const SystemWipePage = lazy(() => import("./pages/SystemWipePage"));
const AdminReceiptPrintPage = lazy(
  () => import("./pages/AdminReceiptPrintPage"),
);
import "./admin.css";

type AdminRoute =
  | "dashboard"
  | "data"
  | "slips"
  | "receipts"
  | "receipts-print"
  | "legacy"
  | "legacy-import"
  | "seminars"
  | "broadcast"
  | "message-templates"
  | "agm"
  | "staff"
  | "create-member"
  | "wipe";

function parseRoute(pathname: string): AdminRoute {
  const p = pathname.replace(/\/+$/, "") || "/admin";
  if (p.endsWith("/data") || p.endsWith("/reviews/data")) return "data";
  if (p.endsWith("/slips") || p.endsWith("/reviews/slips")) return "slips";
  if (p.endsWith("/receipts/print")) return "receipts-print";
  if (p.endsWith("/receipts")) return "receipts";
  if (p.endsWith("/legacy/import") || p.endsWith("/legacy-import")) {
    return "legacy-import";
  }
  if (p.endsWith("/legacy") || p.endsWith("/legacy/members")) return "legacy";
  if (p.endsWith("/seminars")) return "seminars";
  if (
    p.endsWith("/message-templates") ||
    p.endsWith("/templates") ||
    p.endsWith("/broadcast/templates")
  ) {
    return "message-templates";
  }
  if (p.endsWith("/broadcast")) return "broadcast";
  if (p.endsWith("/agm") || p.endsWith("/agm-report")) return "agm";
  if (p.endsWith("/staff")) return "staff";
  if (p.endsWith("/members/new") || p.endsWith("/create-member")) {
    return "create-member";
  }
  if (p.endsWith("/system/wipe") || p.endsWith("/wipe")) return "wipe";
  return "dashboard";
}

function navigate(route: AdminRoute) {
  const map: Record<AdminRoute, string> = {
    dashboard: "/admin",
    data: "/admin/data",
    slips: "/admin/slips",
    receipts: "/admin/receipts",
    "receipts-print": "/admin/receipts/print",
    legacy: "/admin/legacy",
    "legacy-import": "/admin/legacy/import",
    seminars: "/admin/seminars",
    broadcast: "/admin/broadcast",
    "message-templates": "/admin/message-templates",
    agm: "/admin/agm",
    staff: "/admin/staff",
    "create-member": "/admin/members/new",
    wipe: "/admin/system/wipe",
  };
  window.history.pushState({}, "", map[route]);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [route, setRoute] = useState<AdminRoute>(() =>
    parseRoute(window.location.pathname),
  );
  const [counts, setCounts] = useState({ data: 0, slips: 0 });
  const [navOpen, setNavOpen] = useState(false);

  function go(next: AdminRoute) {
    setNavOpen(false);
    navigate(next);
  }

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    void initAuth((u) => {
      if (!cancelled) setUser(u);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("bo-nav-open", navOpen);
    return () => document.body.classList.remove("bo-nav-open");
  }, [navOpen]);

  useEffect(() => {
    // Wait until Firebase auth settles (null or User).
    if (user === undefined) return;

    if (!user && !ADMIN_OPEN_ACCESS) {
      setMe(null);
      setAuthError(null);
      return;
    }

    let cancelled = false;
    setLoadingMe(true);
    setAuthError(null);
    fetchAdminMe()
      .then((m) => {
        if (!cancelled) setMe(m);
      })
      .catch((err: Error & { code?: string; status?: number }) => {
        if (cancelled) return;
        setMe(null);
        if (err.code === "not_authorized" || err.status === 403) {
          setAuthError("not_authorized");
        } else if (err.code === "auth_required" || err.status === 401) {
          setAuthError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        } else if (err.code === "not_found" || err.status === 404) {
          setAuthError(
            "API Back Office ยังไม่พร้อม (404) — ต้อง deploy Cloud Functions ก่อน",
          );
        } else {
          setAuthError(err.message || "โหลดสิทธิ์ไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMe(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!me) return;
    fetchDashboard()
      .then((d: DashboardData) => {
        setCounts({
          data: d.pendingDataReviews,
          slips: d.pendingSlipReviews,
        });
      })
      .catch(() => undefined);
  }, [me, route]);

  const canSeeData = useMemo(
    () =>
      Boolean(
        me?.isSuperAdmin ||
          me?.roles.includes("admin") ||
          me?.roles.includes("registrar"),
      ),
    [me],
  );
  const canSeeSlips = useMemo(
    () =>
      Boolean(
        me?.isSuperAdmin ||
          me?.roles.includes("admin") ||
          me?.roles.includes("treasurer"),
      ),
    [me],
  );
  const canImportLegacy = useMemo(
    () => Boolean(me?.isSuperAdmin || me?.roles.includes("admin")),
    [me],
  );
  const canBroadcast = useMemo(
    () => Boolean(me && canSendBroadcast(me)),
    [me],
  );
  const canCreate = useMemo(
    () => Boolean(me && canCreateMember(me)),
    [me],
  );

  if (user === undefined) {
    return (
      <div className="bo-root">
        <div className="bo-login">
          <div className="bo-login-card">
            <p className="brand">
              AB<span className="gold">TA</span>
            </p>
            <p>กำลังตรวจสอบเซสชัน…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !ADMIN_OPEN_ACCESS) {
    return <LoginScreen />;
  }

  async function handleSignOut() {
    await signOutAdmin();
  }

  if (loadingMe) {
    return (
      <div className="bo-root">
        <div className="bo-login">
          <div className="bo-login-card">
            <p className="brand">
              AB<span className="gold">TA</span>
            </p>
            <p>กำลังโหลดสิทธิ์เจ้าหน้าที่…</p>
          </div>
        </div>
      </div>
    );
  }

  if (
    !ADMIN_OPEN_ACCESS &&
    (authError === "not_authorized" || (!me && !authError))
  ) {
    return (
      <UnauthorizedScreen
        email={me?.email ?? user?.email ?? ""}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  if (authError || !me) {
    return (
      <div className="bo-root">
        <div className="bo-login">
          <div className="bo-login-card">
            <p className="brand">
              AB<span className="gold">TA</span>
            </p>
            <div className="bo-error">{authError || "โหลดสิทธิ์ไม่สำเร็จ"}</div>
            {user ? (
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                onClick={() => void handleSignOut()}
              >
                ออกจากระบบ
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (route === "receipts-print") {
    return (
      <Suspense
        fallback={
          <div className="rcpt-shell">
            <main className="rcpt-wrap">
              <p className="rcpt-lead">กำลังโหลดใบเสร็จ…</p>
            </main>
          </div>
        }
      >
        <AdminReceiptPrintPage />
      </Suspense>
    );
  }

  const titleMap: Record<Exclude<AdminRoute, "receipts-print">, string> = {
    dashboard: "ค้นหาสมาชิก",
    data: "ตรวจข้อมูลสมาชิก",
    slips: "ตรวจสลิป / ใบเสร็จ",
    receipts: "ค้นหาใบเสร็จ",
    legacy: "สมาชิกเก่า",
    "legacy-import": "นำเข้าสมาชิกเก่า",
    seminars: "สัมมนา",
    broadcast: "ส่งข้อความแบบกลุ่ม",
    "message-templates": "แม่แบบข้อความ",
    agm: "รายชื่อผู้มีสิทธิ์ประชุม",
    staff: "จัดการเจ้าหน้าที่",
    "create-member": "สร้างสมาชิก",
    wipe: "ล้างข้อมูลทดลอง",
  };

  let page: ReactNode = <DashboardPage me={me} onCounts={setCounts} />;
  if (route === "data" && canSeeData) {
    page = (
      <DataReviewPage me={me} onChanged={() => refreshCounts(setCounts)} />
    );
  } else if (route === "slips" && canSeeSlips) {
    page = (
      <SlipReviewPage me={me} onChanged={() => refreshCounts(setCounts)} />
    );
  } else if (route === "receipts") {
    page = <ReceiptsPage me={me} />;
  } else if (route === "legacy") {
    page = <LegacyMembersPage />;
  } else if (route === "legacy-import" && canImportLegacy) {
    page = <LegacyImportPage me={me} />;
  } else if (route === "seminars" && canSeeData) {
    page = <SeminarsPage />;
  } else if (route === "broadcast" && canBroadcast) {
    page = <BroadcastPage />;
  } else if (route === "message-templates" && canBroadcast) {
    page = <MessageTemplatesPage />;
  } else if (route === "agm" && canSeeData) {
    page = <AgmReportPage me={me} />;
  } else if (route === "staff" && me.canManageStaff) {
    page = <StaffPage me={me} />;
  } else if (route === "create-member" && canCreate) {
    page = <CreateMemberPage me={me} />;
  } else if (route === "wipe" && me.isSuperAdmin) {
    page = <SystemWipePage />;
  } else if (route !== "dashboard") {
    page = (
      <div className="bo-panel">
        <div className="bo-empty">
          <strong>ไม่มีสิทธิ์เข้าหน้านี้</strong>
          บทบาทปัจจุบันของคุณไม่ครอบคลุมเมนูนี้
        </div>
      </div>
    );
  }

  return (
    <div className="bo-root">
      {navOpen ? (
        <button
          type="button"
          className="bo-nav-backdrop"
          aria-label="ปิดเมนู"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <div className="bo-layout">
        <aside className={`bo-sidebar${navOpen ? " nav-open" : ""}`}>
          <div className="bo-brand">
            <div className="bo-brand-text">
              <p className="bo-brand-mark">ABTA</p>
              <p className="bo-brand-sub">Back Office · Phase 1</p>
            </div>
            <button
              type="button"
              className="bo-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="bo-mobile-nav"
              aria-label={navOpen ? "ปิดเมนู" : "เปิดเมนู"}
              onClick={() => setNavOpen((o) => !o)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {navOpen ? (
                  <>
                    <path d="M6 6 18 18" />
                    <path d="M18 6 6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <nav className="bo-nav" id="bo-mobile-nav" aria-label="เมนูหลัก">
            <NavGroup title="หลัก">
              <NavBtn
                active={route === "dashboard"}
                onClick={() => go("dashboard")}
                label="ค้นหาสมาชิก"
                icon="members"
              />
              <NavBtn
                active={route === "receipts"}
                onClick={() => go("receipts")}
                label="ค้นหาใบเสร็จ"
                icon="receipt"
              />
            </NavGroup>

            {(canSeeData || canSeeSlips) && (
              <NavGroup title="คิวตรวจ">
                {canSeeData && (
                  <NavBtn
                    active={route === "data"}
                    onClick={() => go("data")}
                    label="ตรวจข้อมูลสมาชิก"
                    count={counts.data}
                    icon="review-data"
                  />
                )}
                {canSeeSlips && (
                  <NavBtn
                    active={route === "slips"}
                    onClick={() => go("slips")}
                    label="ตรวจสลิป / ใบเสร็จ"
                    count={counts.slips}
                    icon="review-slip"
                  />
                )}
              </NavGroup>
            )}

            {canSeeData && (
              <NavGroup title="กิจกรรม">
                <NavBtn
                  active={route === "seminars"}
                  onClick={() => go("seminars")}
                  label="สัมมนา"
                  icon="seminar"
                />
                <NavBtn
                  active={route === "agm"}
                  onClick={() => go("agm")}
                  label="รายชื่อผู้มีสิทธิ์ประชุม"
                  icon="agm"
                />
              </NavGroup>
            )}

            {canBroadcast && (
              <NavGroup title="LINE">
                <NavBtn
                  active={route === "broadcast"}
                  onClick={() => go("broadcast")}
                  label="ส่งข้อความแบบกลุ่ม"
                  icon="broadcast"
                />
                <NavBtn
                  active={route === "message-templates"}
                  onClick={() => go("message-templates")}
                  label="แม่แบบข้อความ"
                  icon="template"
                />
              </NavGroup>
            )}

            <NavGroup title="ข้อมูลเก่า">
              <NavBtn
                active={route === "legacy"}
                onClick={() => go("legacy")}
                label="สมาชิกเก่า"
                icon="legacy"
              />
              {canImportLegacy ? (
                <NavBtn
                  active={route === "legacy-import"}
                  onClick={() => go("legacy-import")}
                  label="นำเข้า Excel"
                  icon="import"
                />
              ) : null}
            </NavGroup>

            {me.canManageStaff ? (
              <NavGroup title="ตั้งค่า">
                <NavBtn
                  active={route === "create-member"}
                  onClick={() => go("create-member")}
                  label="สร้างสมาชิก"
                  icon="create-member"
                />
                <NavBtn
                  active={route === "staff"}
                  onClick={() => go("staff")}
                  label="จัดการเจ้าหน้าที่"
                  icon="staff"
                />
              </NavGroup>
            ) : null}

            {me.isSuperAdmin ? (
              <NavGroup title="ระบบ">
                <NavBtn
                  active={route === "wipe"}
                  onClick={() => go("wipe")}
                  label="ล้างข้อมูลทดลอง"
                  icon="wipe"
                />
              </NavGroup>
            ) : null}
          </nav>

          <div className="bo-sidebar-foot">
            <strong>{me.displayName || "เจ้าหน้าที่"}</strong>
            <span>{me.email}</span>
            <div className="bo-sidebar-foot__roles">
              {me.roles.map((r: StaffRole) => (
                <span key={r} className={`bo-badge role-${r}`}>
                  {ROLE_LABEL[r]}
                </span>
              ))}
            </div>
          </div>
        </aside>
        <div className="bo-main">
          <header className="bo-topbar">
            <h1>{titleMap[route as Exclude<AdminRoute, "receipts-print">]}</h1>
            <div className="bo-topbar-actions">
              {user ? (
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  onClick={() => void handleSignOut()}
                >
                  ออกจากระบบ
                </button>
              ) : ADMIN_OPEN_ACCESS ? (
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  onClick={() => void signInWithGoogle()}
                >
                  เข้าสู่ระบบ Google (ไม่บังคับ)
                </button>
              ) : null}
            </div>
          </header>

          <div className="bo-content">
            <Suspense
              fallback={
                <div className="bo-panel">
                  <div className="bo-empty">กำลังโหลด…</div>
                </div>
              }
            >
              {page}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGroup(props: { title: string; children: ReactNode }) {
  return (
    <div className="bo-nav-group">
      <p className="bo-nav-section">{props.title}</p>
      <div className="bo-nav-group__items">{props.children}</div>
    </div>
  );
}

type NavIconName =
  | "members"
  | "receipt"
  | "review-data"
  | "review-slip"
  | "seminar"
  | "agm"
  | "broadcast"
  | "template"
  | "legacy"
  | "import"
  | "staff"
  | "create-member"
  | "wipe";

function NavIcon(props: { name: NavIconName }) {
  const svgProps = {
    className: "bo-nav-btn__icon",
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (props.name) {
    case "members":
      return (
        <svg {...svgProps}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...svgProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "review-data":
      return (
        <svg {...svgProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "review-slip":
      return (
        <svg {...svgProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h6" />
        </svg>
      );
    case "seminar":
      return (
        <svg {...svgProps}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "agm":
      return (
        <svg {...svgProps}>
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17V5M8 17v-3" />
        </svg>
      );
    case "broadcast":
      return (
        <svg {...svgProps}>
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case "template":
      return (
        <svg {...svgProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case "legacy":
      return (
        <svg {...svgProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "import":
      return (
        <svg {...svgProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5M12 15V3" />
        </svg>
      );
    case "staff":
      return (
        <svg {...svgProps}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "create-member":
      return (
        <svg {...svgProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      );
    case "wipe":
      return (
        <svg {...svgProps}>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      );
    default:
      return null;
  }
}

function NavBtn(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  icon?: NavIconName;
}) {
  return (
    <button
      type="button"
      className={`bo-nav-btn${props.active ? " active" : ""}`}
      onClick={props.onClick}
    >
      {props.icon ? <NavIcon name={props.icon} /> : null}
      <span className="bo-nav-btn__label">{props.label}</span>
      {props.count != null && props.count > 0 ? (
        <span className="bo-nav-count">{props.count}</span>
      ) : null}
    </button>
  );
}

function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError(
        "เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ตรวจว่าเปิด Google provider แล้ว",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-root">
      <div className="bo-login">
        <div className="bo-login-card">
          <p className="brand">
            AB<span className="gold">TA</span>
          </p>
          <h1>Back Office</h1>
          <p>เข้าสู่ระบบด้วย Google สำหรับเจ้าหน้าที่สมาคมเท่านั้น</p>
          {error ? <div className="bo-error">{error}</div> : null}
          <button
            type="button"
            className="bo-google"
            disabled={busy}
            onClick={() => void onLogin()}
          >
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบด้วย Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnauthorizedScreen(props: { email: string; onSignOut: () => void }) {
  return (
    <div className="bo-root">
      <div className="bo-login">
        <div className="bo-login-card">
          <p className="brand">
            AB<span className="gold">TA</span>
          </p>
          <h1>ไม่มีสิทธิ์</h1>
          <p>
            อีเมล <strong>{props.email}</strong> ไม่อยู่ในรายชื่อเจ้าหน้าที่
            กรุณาติดต่อแอดมินเพื่อเพิ่มสิทธิ์
          </p>
          <button
            type="button"
            className="bo-btn bo-btn-ghost"
            onClick={props.onSignOut}
          >
            ออกจากระบบ / เปลี่ยนบัญชี
          </button>
        </div>
      </div>
    </div>
  );
}

function refreshCounts(
  setCounts: (c: { data: number; slips: number }) => void,
) {
  fetchDashboard()
    .then((d) =>
      setCounts({ data: d.pendingDataReviews, slips: d.pendingSlipReviews }),
    )
    .catch(() => undefined);
}
