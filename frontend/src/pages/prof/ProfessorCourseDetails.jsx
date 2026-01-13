import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/ProfessorStart.css";

const API = "http://localhost:3000";
const GROUPS_BASE = `${API}/groups`;
const COURSE_BASE = `${API}/courses`; // schimba daca groups router e montat altfel

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body.error || res.statusText);
    throw new Error(msg);
  }
  return body;
}

const STAFF_ROLES = ["lecturer", "assistant", "lab", "other"];

export default function ProfessorCourseDetails() {
  const { courseId } = useParams();
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");

  const [course, setCourse] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [professors, setProfessors] = useState([]);

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // offering base fields
  const [form, setForm] = useState({
    academicYear: "",
    semester: "",
    mainProfessorId: me?.id ? String(me.id) : "",
    groupId: "",
  });

  // staff rows: [{ userId: "1", role: "assistant" }]
  const [staffRows, setStaffRows] = useState([
    // optional: adaugam main professor implicit ca lecturer
    // { userId: me?.id ? String(me.id) : "", role: "lecturer" },
  ]);

  const professorById = useMemo(() => {
    const m = new Map();
    for (const p of professors) m.set(String(p.id), p);
    return m;
  }, [professors]);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setSuccess("");

        if (!token) {
          setErr("Missing token. Please login again.");
          return;
        }

        const courseData = await fetchJson(`${API}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(courseData);

        const offData = await fetchJson(`${API}/courses/${courseId}/offerings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOfferings(Array.isArray(offData) ? offData : (offData ? [offData] : []));

        const profData = await fetchJson(`${API}/auth/professors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfessors(Array.isArray(profData) ? profData : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [courseId]);

  const addStaffRow = () => {
    setStaffRows((prev) => [...prev, { userId: "", role: "other" }]);
  };

  const removeStaffRow = (idx) => {
    setStaffRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStaffRow = (idx, patch) => {
    setStaffRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const validateStaffRows = () => {
    // allow empty rows? no -> remove or error
    for (const row of staffRows) {
      if (!row.userId) continue; // permitem randuri goale (nu le trimitem)
      if (!STAFF_ROLES.includes(row.role)) {
        throw new Error("Invalid staff role selected.");
      }
    }

    // prevent duplicates userId
    const seen = new Set();
    for (const row of staffRows) {
      if (!row.userId) continue;
      const key = String(row.userId);
      if (seen.has(key)) throw new Error("Duplicate staff member selected.");
      seen.add(key);
    }
  };

  const createOffering = async (e) => {
    e.preventDefault();

    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      if (!form.groupId) throw new Error("Group ID is required (for linking).");

      validateStaffRows();

      // A) CREATE OFFERING
      const created = await fetchJson(`${API}/courses/${courseId}/offerings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: Number(courseId),
          academicYear: form.academicYear,
          semester: form.semester,
          mainProfessorId: Number(form.mainProfessorId),
        }),
      });

      const offeringId = created?.id ?? created?.offeringId;
      if (!offeringId) throw new Error("Backend did not return offering id.");

      // B) LINK GROUP -> OFFERING
      await fetchJson(
        `${GROUPS_BASE}/${Number(form.groupId)}/course-offerings/${offeringId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // C) ADD STAFF (CourseStaff rows)
      // route: POST /offerings/:offeringId/staff
      // body expected: { userId, role }
      const rowsToSend = staffRows.filter((r) => r.userId);

      for (const r of rowsToSend) {
        await fetchJson(`${API}/courses/offerings/${offeringId}/staff`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userId: Number(r.userId),
            role: r.role,
          }),
        });
      }

      // update UI
      setOfferings((prev) => [created, ...prev]);
      setForm((p) => ({ ...p, academicYear: "", semester: "" }));
      setStaffRows([]);
      setSuccess(`Offering created (id: ${offeringId}) + group linked + staff added ✅`);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteOffering = async (offering) => {
    try {
      setErr("");
      setSuccess("");

      const offeringId = offering.id;
      const groupId = offering.groupId ?? offering.group?.id;

      if (!offeringId) throw new Error("Missing offering id.");

      setBusy(true);

      // 1) unlink group -> offering (only if we actually have groupId)
      if (groupId) {
        await fetchJson(`${GROUPS_BASE}/${Number(groupId)}/course-offerings/${Number(offeringId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // 2) delete offering (cascade)
      await fetchJson(`${API}/courses/offerings/${Number(offeringId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // update UI
      setOfferings((prev) => prev.filter((o) => o.id !== offeringId));
      setSuccess(`Offering #${offeringId} deleted ✅`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="prof-container">
      <div className="prof-card wide">
        <div className="prof-header">
          <div>
            <h2>{course?.name || `Course #${courseId}`}</h2>
            <p className="prof-subtitle">Offerings for this course</p>
          </div>
          <Link className="prof-btn secondary" to="/prof/courses">Back</Link>
        </div>

        {/* CREATE OFFERING FORM */}
        <form onSubmit={createOffering} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
          <input
            placeholder="Academic Year (ex: 2025-2026)"
            value={form.academicYear}
            onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            required
          />

          <input
            placeholder="Semester (ex: summer)"
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            required
          />

          <select
            value={form.mainProfessorId}
            onChange={(e) => setForm((p) => ({ ...p, mainProfessorId: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            required
          >
            <option value="" disabled>Select main professor</option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email}) — id: {p.id}
              </option>
            ))}
          </select>

          {/* GROUP LINK */}
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Group to link</div>
            <input
              placeholder="Group ID (required)"
              value={form.groupId}
              onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              required
            />
          </div>

          {/* STAFF TABLE */}
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 800 }}>Staff (CourseStaff)</div>
              <button type="button" className="prof-btn secondary" onClick={addStaffRow} disabled={busy}>
                + Add staff member
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {staffRows.length === 0 && (
                <div style={{ color: "#6b7280", fontWeight: 600 }}>
                  No staff selected (optional). You can add assistants/lab staff here.
                </div>
              )}

              {staffRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 170px 90px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <select
                    value={row.userId}
                    onChange={(e) => updateStaffRow(idx, { userId: e.target.value })}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  >
                    <option value="">Select professor</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email}) — id: {p.id}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.role}
                    onChange={(e) => updateStaffRow(idx, { role: e.target.value })}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="prof-btn secondary"
                    onClick={() => removeStaffRow(idx)}
                    disabled={busy}
                  >
                    Remove
                  </button>

                  {row.userId && (
                    <div style={{ gridColumn: "1 / -1", color: "#6b7280", fontWeight: 600 }}>
                      Selected: {professorById.get(String(row.userId))?.name || row.userId} as <b>{row.role}</b>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          <button className="prof-btn" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create Offering"}
          </button>
        </form>

        {err && <div className="prof-error" style={{ marginTop: 12 }}>{err}</div>}
        {success && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#065f46",
              fontWeight: 800,
            }}
          >
            {success}
          </div>
        )}

        {/* OFFERINGS LIST */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {offerings.map((o) => (
            <div
              key={o.id}
              className="offering"
              style={{ background: "#fff", display: "flex", justifyContent: "space-between", gap: 12 }}
            >
              <div>
                <div className="offering-title">
                  Offering #{o.id} • {o.academicYear} • {o.semester}
                </div>
                <div className="offering-meta">
                  <span>Main professor ID: {o.mainProfessorId}</span>
                  {o.groupId && <span> • Group ID: {o.groupId}</span>}
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => deleteOffering(o)}
                style={{
                  alignSelf: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontWeight: 800,
                  cursor: busy ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  height: "fit-content",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
