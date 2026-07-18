import { firebaseConfig } from "./lib/firebase";
import AdminApp from "./admin/AdminApp";
import RegisterPage from "./pages/RegisterPage";
import StatusPage from "./pages/StatusPage";
import "./App.css";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  // Digital member card / receipt / full status all render the status view.
  if (path === "/status" || path === "/card" || path === "/receipt") {
    return <StatusPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
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
