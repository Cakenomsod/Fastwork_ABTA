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
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

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
  const liffId = import.meta.env.VITE_LIFF_ID ?? "";
  const projectId = firebaseConfig.projectId;

  return (
    <main className="page">
      <p className="brand">ABTA สมาชิก</p>
      <h1>ระบบสมาชิก</h1>
      <p className="lead">
        เปิดจาก LINE Official Account เพื่อสมัคร / เช็คสถานะ / สัมมนา
      </p>
      <dl className="meta">
        <div>
          <dt>Firebase</dt>
          <dd>{projectId || "—"}</dd>
        </div>
        <div>
          <dt>LIFF</dt>
          <dd>{liffId || "ยังไม่ตั้งค่า VITE_LIFF_ID"}</dd>
        </div>
      </dl>
      <p className="lead" style={{ marginTop: "1.5rem" }}>
        <a href="/register">ไปหน้าสมัครสมาชิก</a>
        {" · "}
        <a href="/admin">Back Office</a>
      </p>
    </main>
  );
}

export default App;
