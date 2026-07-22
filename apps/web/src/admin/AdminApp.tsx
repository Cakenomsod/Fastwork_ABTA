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
import "./admin.css";

type AdminRoute =
  | "dashboard"
  | "data"
  | "slips"
  | "legacy"
  | "legacy-import"
  | "seminars"
  | "broadcast"
  | "message-templates"
  | "agm"
  | "staff";

function parseRoute(pathname: string): AdminRoute {
  const p = pathname.replace(/\/+$/, "") || "/admin";
  if (p.endsWith("/data") || p.endsWith("/reviews/data")) return "data";
  if (p.endsWith("/slips") || p.endsWith("/reviews/slips")) return "slips";
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
  return "dashboard";
}

function navigate(route: AdminRoute) {
  const map: Record<AdminRoute, string> = {
    dashboard: "/admin",
    data: "/admin/data",
    slips: "/admin/slips",
    legacy: "/admin/legacy",
    "legacy-import": "/admin/legacy/import",
    seminars: "/admin/seminars",
    broadcast: "/admin/broadcast",
    "message-templates": "/admin/message-templates",
    agm: "/admin/agm",
    staff: "/admin/staff",
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

  const titleMap: Record<AdminRoute, string> = {
    dashboard: "Dashboard",
    data: "ตรวจข้อมูลสมาชิก",
    slips: "ตรวจสลิป / ใบเสร็จ",
    legacy: "สมาชิกเก่า",
    "legacy-import": "นำเข้าสมาชิกเก่า",
    seminars: "สัมมนา",
    broadcast: "ส่งข้อความแบบกลุ่ม",
    "message-templates": "แม่แบบข้อความ",
    agm: "สิทธิ์ประชุมใหญ่",
    staff: "จัดการเจ้าหน้าที่",
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
    page = <StaffPage />;
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
            <p className="bo-nav-section">สมาชิก</p>
            <NavBtn
              active={route === "dashboard"}
              onClick={() => go("dashboard")}
              label="Dashboard"
            />
            {canSeeData && (
              <NavBtn
                active={route === "data"}
                onClick={() => go("data")}
                label="ตรวจข้อมูล"
                count={counts.data}
              />
            )}
            {canSeeSlips && (
              <NavBtn
                active={route === "slips"}
                onClick={() => go("slips")}
                label="ตรวจสลิป"
                count={counts.slips}
              />
            )}
            {canSeeData && (
              <NavBtn
                active={route === "seminars"}
                onClick={() => go("seminars")}
                label="สัมมนา"
              />
            )}
            {canBroadcast && (
              <NavBtn
                active={route === "broadcast"}
                onClick={() => go("broadcast")}
                label="ส่งข้อความแบบกลุ่ม"
              />
            )}
            {canSeeData && (
              <NavBtn
                active={route === "agm"}
                onClick={() => go("agm")}
                label="สิทธิ์ประชุมใหญ่"
              />
            )}

            <p className="bo-nav-section">ข้อมูลเก่า</p>
            <NavBtn
              active={route === "legacy"}
              onClick={() => go("legacy")}
              label="สมาชิกเก่า"
            />
            {canImportLegacy ? (
              <NavBtn
                active={route === "legacy-import"}
                onClick={() => go("legacy-import")}
                label="นำเข้า Excel"
              />
            ) : null}

            {canBroadcast || me.canManageStaff ? (
              <>
                <p className="bo-nav-section">ระบบ</p>
                {canBroadcast ? (
                  <NavBtn
                    active={route === "message-templates"}
                    onClick={() => go("message-templates")}
                    label="แม่แบบข้อความ"
                  />
                ) : null}
                {me.canManageStaff ? (
                  <NavBtn
                    active={route === "staff"}
                    onClick={() => go("staff")}
                    label="เจ้าหน้าที่"
                  />
                ) : null}
              </>
            ) : null}
          </nav>

          <div className="bo-sidebar-foot">
            <strong>{me.displayName || "เจ้าหน้าที่"}</strong>
            <span>{me.email}</span>
            <div
              style={{
                marginTop: "0.45rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
              }}
            >
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
            <h1>{titleMap[route]}</h1>
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

function NavBtn(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      className={`bo-nav-btn${props.active ? " active" : ""}`}
      onClick={props.onClick}
    >
      {props.label}
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
