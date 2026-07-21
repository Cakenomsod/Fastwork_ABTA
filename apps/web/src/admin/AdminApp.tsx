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
const LegacyImportPage = lazy(() => import("./pages/LegacyImportPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
import "./admin.css";

type AdminRoute = "dashboard" | "data" | "slips" | "legacy" | "staff";

function parseRoute(pathname: string): AdminRoute {
  const p = pathname.replace(/\/+$/, "") || "/admin";
  if (p.endsWith("/data") || p.endsWith("/reviews/data")) return "data";
  if (p.endsWith("/slips") || p.endsWith("/reviews/slips")) return "slips";
  if (p.endsWith("/legacy") || p.endsWith("/legacy-import")) return "legacy";
  if (p.endsWith("/staff")) return "staff";
  return "dashboard";
}

function navigate(route: AdminRoute) {
  const map: Record<AdminRoute, string> = {
    dashboard: "/admin",
    data: "/admin/data",
    slips: "/admin/slips",
    legacy: "/admin/legacy",
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
    legacy: "นำเข้าสมาชิกเก่า",
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
  } else if (route === "legacy" && canImportLegacy) {
    page = <LegacyImportPage me={me} />;
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
        <aside className="bo-sidebar">
          <div className="bo-brand">
            <p className="bo-brand-mark">ABTA</p>
            <p className="bo-brand-sub">Back Office · Phase 1</p>
          </div>

          <nav className="bo-nav" aria-label="เมนูหลัก">
            <p className="bo-nav-section">สมาชิก</p>
            <NavBtn
              active={route === "dashboard"}
              onClick={() => navigate("dashboard")}
              label="Dashboard"
            />
            {canSeeData && (
              <NavBtn
                active={route === "data"}
                onClick={() => navigate("data")}
                label="ตรวจข้อมูล"
                count={counts.data}
              />
            )}
            {canSeeSlips && (
              <NavBtn
                active={route === "slips"}
                onClick={() => navigate("slips")}
                label="ตรวจสลิป"
                count={counts.slips}
              />
            )}

            {canImportLegacy ? (
              <>
                <p className="bo-nav-section">ข้อมูลเก่า</p>
                <NavBtn
                  active={route === "legacy"}
                  onClick={() => navigate("legacy")}
                  label="นำเข้า Excel"
                />
              </>
            ) : null}

            {me.canManageStaff ? (
              <>
                <p className="bo-nav-section">ระบบ</p>
                <NavBtn
                  active={route === "staff"}
                  onClick={() => navigate("staff")}
                  label="เจ้าหน้าที่"
                />
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
              {ADMIN_OPEN_ACCESS ? (
                <span
                  className="bo-open-access-badge"
                  title="ปิดได้ที่ ADMIN_OPEN_ACCESS"
                >
                  โหมดเปิดตรวจงาน
                </span>
              ) : null}
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
          {ADMIN_OPEN_ACCESS ? (
            <div className="bo-open-access-banner" role="status">
              เปิดสิทธิ์ชั่วคราวให้ทุกคนใช้งานได้เต็มที่ รวมจัดการเจ้าหน้าที่ —
              อย่าลืมปิดหลังลูกค้าตรวจงานเสร็จ
            </div>
          ) : null}
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
