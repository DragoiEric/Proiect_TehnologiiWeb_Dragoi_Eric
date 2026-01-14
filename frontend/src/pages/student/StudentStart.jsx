import { useEffect, useState } from "react";
import "../../styles/ProfessorStart.css";
import { Link } from "react-router-dom";


const API = "http://localhost:3000";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body.error || res.statusText);
    throw new Error(msg);
  }

  return body;
}

export default function StudentStart() {
  const token = localStorage.getItem("token");
  const [offerings, setOfferings] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr("");
    setBusy(true);
    try {
      if (!token) throw new Error("Missing token. Please login again.");

      const data = await fetchJson(`${API}/courses/offerings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("STUDENT offerings response:", data);

      setOfferings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("STUDENT offerings error:", e.message);
      setErr(e.message);
      setOfferings([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="prof-container">
      <div className="prof-card wide">
        <div className="prof-header">
          <div>
            <h2>Student Dashboard</h2>
            <p className="prof-subtitle">Your course offerings</p>
          </div>
          <button className="prof-btn secondary" disabled={busy} onClick={load}>
            Refresh
          </button>
          <Link className="prof-btn secondary" to="/dashboard/jury">Jury</Link>

        </div>

        {err && <div className="prof-error" style={{ marginTop: 12 }}>{err}</div>}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {offerings.length === 0 ? (
            <div style={{ color: "#6b7280", fontWeight: 700 }}>
              No offerings found
            </div>
          ) : (
            offerings.map((o) => (
              <div key={o.id} className="offering" style={{ background: "#fff" }}>
                <div className="offering-title">
                  Offering #{o.id} • {o.academicYear} • {o.semester}
                </div>
                <div className="offering-meta">
                  <span>Course ID: {o.courseId}</span>
                  <span> • Main professor ID: {o.mainProfessorId}</span>
                </div>
                <Link className="prof-btn" to={`/dashboard/offerings/${o.id}`}>Open</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
