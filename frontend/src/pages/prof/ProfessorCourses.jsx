import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/ProfessorStart.css";

export default function ProfessorCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("http://localhost:3000/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load courses");
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      setErr("");

      const res = await fetch("http://localhost:3000/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create course");

      setCourses((prev) => [data, ...prev]);
      setForm({ code: "", name: "" });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="prof-container">
      <div className="prof-card wide">
        <div className="prof-header">
          <div>
            <h2>Courses</h2>
            <p className="prof-subtitle">Create courses, then create offerings per course</p>
          </div>
          <Link className="prof-btn secondary" to="/prof">Back</Link>
        </div>

        <form onSubmit={createCourse} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Code (ex: CS101)"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            required
          />
          <input
            placeholder="Name (ex: Databases)"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minWidth: 260 }}
            required
          />
          <button className="prof-btn" type="submit">Create Course</button>
        </form>

        {err && <div className="prof-error">{err}</div>}
        {loading ? (
          <div style={{ marginTop: 12 }}>Loading...</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {courses.map((c) => (
              <div key={c.id} className="offering" style={{ background: "#fff" }}>
                <div className="offering-title">{c.name}</div>
                <div className="offering-meta">
                  <span>ID: {c.id}</span>
                  {c.code && <span>• Code: {c.code}</span>}
                </div>

                <button
                  className="prof-btn small"
                  style={{ marginTop: 10 }}
                  onClick={() => navigate(`/prof/courses/${c.id}`)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
