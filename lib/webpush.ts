import webpush from "web-push";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "Web Push VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: { title: string; body: string; icon?: string; badge?: string }
) {
  ensureVapidConfigured();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/badge-72.png",
      })
    );
    return { success: true };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, expired: true };
    }
    console.error("Push notification error:", error);
    return { success: false, error };
  }
}

export { webpush };
