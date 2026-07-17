import { firebaseConfig } from "./lib/firebase";
import "./App.css";

function App() {
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
    </main>
  );
}

export default App;
