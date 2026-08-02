import {
  effectiveAppPath,
  hasConfiguredLiffEntry,
  liffPageUrl,
} from "./lib/member-links";
import { firebaseConfig } from "./lib/firebase";
import AdminApp from "./admin/AdminApp";
import ReceiptPage from "./pages/ReceiptPage";
import RegisterPage from "./pages/RegisterPage";
import RenewPage from "./pages/RenewPage";
import SeminarPage from "./pages/SeminarPage";
import SlipResubmitPage from "./pages/SlipResubmitPage";
import StatusPage from "./pages/StatusPage";
import "./App.css";

function App() {
  const path = effectiveAppPath();

  // Digital member card + full status share the status view; receipt is its own printable page.
  if (path === "/status" || path === "/card") {
    return <StatusPage />;
  }

  if (path === "/receipt") {
    return <ReceiptPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }

  if (path === "/renew") {
    return <RenewPage />;
  }

  if (path === "/slip") {
    return <SlipResubmitPage />;
  }

  if (path === "/seminar") {
    return <SeminarPage />;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminApp />;
  }

  return <Landing />;
}

function Landing() {
  const canOpenLine = hasConfiguredLiffEntry();
  const registerHref = canOpenLine ? liffPageUrl("/register") : "/register";
  const legacyHref = canOpenLine
    ? liffPageUrl("/register?flow=legacy")
    : "/register?flow=legacy";

  return (
    <div className="landing-shell">
      <div className="landing-atmosphere" aria-hidden />
      <main className="page">
        <p className="landing-kicker">สมาคมการค้าผู้ประกอบการธุรกิจห้องเช่า</p>
        <h1 className="brand">ABTA สมาชิก</h1>
        <p className="tagline">บริการสมาชิกผ่าน LINE</p>

        {canOpenLine ? (
          <p className="lead">
            ท่านสามารถสมัครสมาชิก ยืนยันสมาชิกเก่า และติดตามสถานะได้ผ่าน LINE
            Official Account ของสมาคม — กดปุ่มด้านล่างเพื่อเริ่มต้นได้เลยครับ
          </p>
        ) : (
          <>
            <p className="lead">
              ระบบสมาชิกใช้งานผ่าน LINE Official Account ของสมาคมเป็นหลัก
            </p>
            <ol className="howto">
              <li>เปิดแอป LINE แล้วเข้า Official Account ของสมาคม ABTA</li>
              <li>เลือกเมนูสมาชิกหรือสมัครสมาชิกจากเมนูในแชท</li>
              <li>
                หากต้องการดูแบบฟอร์มบนเบราว์เซอร์ก่อน
                ใช้ปุ่มสมัครด้านล่างได้ (บางขั้นตอนยังต้องเปิดจาก LINE)
              </li>
            </ol>
          </>
        )}

        <div className="cta-stack">
          <a className="landing-btn landing-btn--primary" href={registerHref}>
            {canOpenLine ? "สมัครสมาชิกใหม่" : "ไปหน้าสมัครสมาชิก"}
          </a>
          <a className="landing-btn landing-btn--secondary" href={legacyHref}>
            ยืนยันสมาชิกเก่า
          </a>
          {canOpenLine ? (
            <a className="landing-btn landing-btn--ghost" href="/register">
              เปิดแบบฟอร์มบนเบราว์เซอร์
            </a>
          ) : null}
        </div>

        {import.meta.env.DEV ? (
          <dl className="meta">
            <div>
              <dt>Firebase</dt>
              <dd>{firebaseConfig.projectId || "—"}</dd>
            </div>
            <div>
              <dt>LIFF ID</dt>
              <dd>
                {(import.meta.env.VITE_LIFF_ID as string | undefined)?.trim() ||
                  "ยังไม่ตั้งค่า VITE_LIFF_ID"}
              </dd>
            </div>
            <div>
              <dt>LIFF URL</dt>
              <dd>
                {(import.meta.env.VITE_LIFF_URL as string | undefined)?.trim() ||
                  "ยังไม่ตั้งค่า VITE_LIFF_URL"}
              </dd>
            </div>
          </dl>
        ) : null}

        <p className="staff-link">
          <a href="/admin">สำหรับเจ้าหน้าที่</a>
        </p>
      </main>
    </div>
  );
}

export default App;
