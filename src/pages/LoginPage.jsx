import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-brand">
          <span className="brand-leaf">&#9643;</span>
          <span className="brand-name">Breathe ESG</span>
        </div>
        <div className="login-tagline">
          <h1>Carbon data,<br />without the chaos.</h1>
          <p>Ingest, normalize, and audit emissions data across your entire enterprise — from SAP exports to utility bills to travel platforms.</p>
        </div>
        <div className="login-scope-pills">
          <span className="scope-pill s1">Scope 1 · Fuel</span>
          <span className="scope-pill s2">Scope 2 · Electricity</span>
          <span className="scope-pill s3">Scope 3 · Travel</span>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="login-sub">Access your analyst dashboard</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                placeholder="analyst@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : "Sign in"}
            </button>
          </form>

          <p className="login-footer">
            Contact your administrator to get access.
          </p>
        </div>
      </div>
    </div>
  );
}
