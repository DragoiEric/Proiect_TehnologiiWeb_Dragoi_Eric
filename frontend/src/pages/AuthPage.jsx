import { useState } from 'react';
import '../styles/AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' or 'professor'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registrationCode: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // endpoint corect
    let endpoint = "http://localhost:3000/auth/login";
    if (!isLogin) {
      endpoint =
        role === "professor"
          ? "http://localhost:3000/auth/register-professor"
          : "http://localhost:3000/auth/register-student";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // REGISTER OK
      if (!isLogin) {
        setMessage("Account created! You can now login.");
        setIsLogin(true);
        return;
      }

      // LOGIN OK
      if (!data.token) {
        setError("Login ok, but token is missing in response");
        return;
      }

      localStorage.setItem("token", data.token);

      // ia user + rolul real
      const meRes = await fetch("http://localhost:3000/auth/me", {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      const me = await meRes.json();

      if (meRes.ok) {
        localStorage.setItem("me", JSON.stringify(me));
        const roleLower = String(me.role || "").toLowerCase();

        window.location.href =
          roleLower === "professor" || roleLower === "admin" ? "/prof" : "/dashboard";
      } else {
        // fallback
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Server connection failed. Make sure backend is running on port 3000.");
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
        
        <div className="toggle-buttons">
          <button onClick={() => setIsLogin(true)} className={isLogin ? 'active' : ''}>Login Mode</button>
          <button onClick={() => setIsLogin(false)} className={!isLogin ? 'active' : ''}>Register Mode</button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="role-selector">
                <label>
                  <input type="radio" value="student" checked={role === 'student'} onChange={() => setRole('student')} /> Student
                </label>
                <label>
                  <input type="radio" value="professor" checked={role === 'professor'} onChange={() => setRole('professor')} /> Professor
                </label>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" placeholder="John Doe" onChange={handleChange} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="email@example.com" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
          </div>

          {!isLogin && role === 'professor' && (
            <div className="form-group">
              <label>Professor Registration Code</label>
              <input type="text" name="registrationCode" placeholder="Enter secret code" onChange={handleChange} required />
            </div>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? 'Sign In' : 'Register as ' + role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
      </div>
    </div>
  );
};

export default AuthPage;
