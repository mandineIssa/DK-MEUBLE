/** Web Push — permission différée + enregistrement subscription (canal log/sandbox si pas de VAPID). */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PROMPT_KEY = "dk_push_prompted_v1";

export async function maybePromptWebPush(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return;
  }
  if (localStorage.getItem(PROMPT_KEY)) return;
  if (Notification.permission === "denied") return;

  localStorage.setItem(PROMPT_KEY, "1");

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.register("/sw-push.js");
    await navigator.serviceWorker.ready;

    const vapidRes = await fetch(`${API}/api/push/vapid-public-key`, {
      headers: { Accept: "application/json" },
    });
    const vapid = vapidRes.ok ? await vapidRes.json() : { public_key: null };

    let subscription: PushSubscription | null = null;
    if (vapid.public_key) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.public_key),
      });
    } else {
      // Sandbox : enregistre un endpoint factice lié à l’origine pour le monitoring admin
      subscription = {
        endpoint: `${window.location.origin}/push-sandbox/${crypto.randomUUID()}`,
        toJSON: () => ({
          endpoint: `${window.location.origin}/push-sandbox/${crypto.randomUUID()}`,
          keys: { p256dh: "sandbox", auth: "sandbox" },
        }),
      } as unknown as PushSubscription;
    }

    const tokenRes = await fetch("/api/customer/session", { cache: "no-store" });
    const session = tokenRes.ok ? await tokenRes.json() : null;
    if (!session?.authenticated) return;

    await fetch("/api/bff/customer/push-subscriptions", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON ? subscription.toJSON() : subscription),
    });
  } catch {
    /* ignore — push optionnel */
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
