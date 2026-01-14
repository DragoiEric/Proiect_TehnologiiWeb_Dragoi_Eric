import { useEffect, useState } from "react";
import "../../styles/ProfessorStart.css";

import { Link } from "react-router-dom";

// in JSX, in header:



export default function ProfessorStart() {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/";
          return;
        }
        const me = JSON.parse(localStorage.getItem("me") || "null");
        const userId = me?.id;
        console.log(userId);
        const res = await fetch(`http://localhost:3000/courses/offerings/teacher/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("STATUS:", res.status);
        console.log("DATA:", data);

        if (!res.ok) {
          // dacă e 403, înseamnă că nu e profesor (sau token greșit)
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        if (alive) setOfferings(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load course offerings");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="prof-container">
        <div className="prof-card">Loading course offerings...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="prof-container">
        <div className="prof-card">
          <h2>Professor Home</h2>
          <div className="prof-error">{err}</div>
          <div className="prof-actions">
            <button className="prof-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
            <button className="prof-btn secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prof-container">
      <div className="prof-card wide">
        <div className="prof-header">
          <div>
            <h2>Welcome, Professor 👋</h2>
            <p className="prof-subtitle">Your course offerings</p>
          </div>
          <button className="prof-btn secondary" onClick={handleLogout}>
            Logout
          </button>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="prof-btn secondary" to="/prof/courses">Manage Courses</Link>
            <Link className="prof-btn secondary" to="/prof/groups">Manage Groups</Link>
          </div>

        </div>

        {offerings.length === 0 ? (
          <div className="prof-empty">No course offerings found.</div>
        ) : (
          <div className="prof-grid">
            {offerings.map((o) => {
              // robust: depinde cum ai făcut include în Sequelize (as: "course" etc.)
              const courseName =
                o.course?.name ||
                o.Course?.name ||
                o.courseName ||
                `Course #${o.courseId ?? "?"}`;

              return (
                <div key={o.id} className="offering">
                  <div className="offering-title">{courseName}</div>
                  <div className="offering-meta" style={{ marginBottom: "20px" }}>
                    <span>Offering ID: {o.id}</span>
                    {o.year != null && <span>• Year: {o.year}</span>}
                    {o.semester != null && <span>• Semester: {o.semester}</span>}
                  </div>
                  <Link className="prof-btn" to={`/prof/offerings/${o.id}`} style={{ marginTop: "50px" }}>Open</Link>


                  {/* Pentru mai târziu: buton de detalii */}
                  {/* <button className="prof-btn small" onClick={() => navigate(`/prof/offerings/${o.id}`)}>Open</button> */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
