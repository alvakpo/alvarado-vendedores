import { supabaseAdmin } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/webpush";

export async function sendPushToAll(payload: { title: string; body: string }) {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*");

  if (!subscriptions || subscriptions.length === 0) return;

  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      if (result.expired) {
        expiredIds.push(sub.id);
      }
    })
  );

  // Remove expired subscriptions
  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }
}
