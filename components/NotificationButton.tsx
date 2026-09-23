"use client";

import { useState, useEffect } from "react";

export default function NotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        checkSubscription();
      }
    }
  }, []);

  async function checkSubscription() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // ignore
    }
  }

  async function handleSubscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Tu navegador no soporta notificaciones push.");
      return;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID key not configured");
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Subscribe error:", err);
    }
    setLoading(false);
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  if (permission === "denied") return null;

  if (subscribed) {
    return (
      <button
        onClick={handleUnsubscribe}
        disabled={loading}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--blue-neon)",
          background: "var(--blue-dim)",
          border: "1px solid var(--border-blue)",
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
        title="Desactivar notificaciones"
      >
        🔔
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-muted)",
        background: "transparent",
        border: "1px solid var(--border)",
        padding: "6px 10px",
        borderRadius: 6,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Activar notificaciones"
    >
      🔕
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
