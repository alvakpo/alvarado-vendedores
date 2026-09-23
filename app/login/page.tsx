"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/logout").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.isLoggedIn) {
          if (data.role === "admin") router.replace("/admin");
          else router.replace("/vendedor");
        }
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
      } else {
        if (data.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/vendedor");
        }
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Logo area */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 60,
            height: 60,
            background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 16px",
            boxShadow: "0 0 30px rgba(14, 165, 233, 0.3)",
          }}
        >
          🎫
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          ALVARADO <span style={{ color: "var(--blue-neon)" }}>VENDEDORES</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Ingresá con tu usuario y contraseña
        </p>
      </div>

      {/* Login form */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 24,
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                color: "#f87171",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "INGRESAR"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a
            href="/"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← Ver tablero público
          </a>
        </div>
      </div>
    </div>
  );
}
