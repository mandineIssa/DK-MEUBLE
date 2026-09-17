"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  adminApi,
  type AdminContentReport,
  type AdminNotificationLog,
  type AdminNotificationStats,
  type AdminNotificationTemplate,
} from "@/lib/adminApi";

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<"settings" | "templates" | "monitor" | "reports" | "chats">("settings");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [templates, setTemplates] = useState<AdminNotificationTemplate[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminNotificationStats | null>(null);
  const [failed, setFailed] = useState<AdminNotificationLog[]>([]);
  const [reports, setReports] = useState<AdminContentReport[]>([]);
  const [chats, setChats] = useState<
    Array<{
      id: number;
      status: string;
      last_message_at: string | null;
      unread_count?: number;
      product?: { id: number; name: string; slug: string };
      customer?: { id: number; name: string | null; phone: string | null };
    }>
  >([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; body: string; sender_type: string; created_at: string }>
  >([]);
  const [chatReply, setChatReply] = useState("");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<Partial<AdminNotificationTemplate> | null>(null);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

  async function refresh() {
    const [s, t, st, f, r, c] = await Promise.all([
      adminApi.getNotificationSettings(),
      adminApi.getNotificationTemplates(),
      adminApi.getNotificationStats(),
      adminApi.getFailedNotifications().catch(() => ({ data: [] as AdminNotificationLog[] })),
      adminApi.getContentReports().catch(() => ({ data: [] as AdminContentReport[] })),
      adminApi.getProductChats().catch(() => ({ data: [] })),
    ]);
    setSettings(s);
    setTemplates(t.data);
    setTypes(t.types);
    setChannels(t.channels);
    setVariables(t.variables);
    setStats(st);
    setFailed(Array.isArray(f.data) ? f.data : []);
    setReports(Array.isArray(r.data) ? r.data : []);
    setChats(Array.isArray(c.data) ? c.data : []);
  }

  useEffect(() => {
    refresh().catch((e) => setMsg(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const next = await adminApi.updateNotificationSettings({
        price_drop_threshold_percent: Number(settings.price_drop_threshold_percent),
        digest_minutes: Number(settings.digest_minutes),
        abandoned_cart_hours: Number(settings.abandoned_cart_hours),
        promo_ending_hours: Number(settings.promo_ending_hours ?? 24),
        push_enabled: Boolean(settings.push_enabled ?? true),
        report_rate_limit_per_hour: Number(settings.report_rate_limit_per_hour ?? 5),
        chat_rate_limit_per_hour: Number(settings.chat_rate_limit_per_hour ?? 30),
        chat_whatsapp_number: String(settings.chat_whatsapp_number ?? ""),
        chat_forward_to_whatsapp: Boolean(settings.chat_forward_to_whatsapp ?? true),
        chat_auto_reply_enabled: Boolean(settings.chat_auto_reply_enabled ?? true),
        chat_greeting_reply: String(settings.chat_greeting_reply ?? ""),
        chat_price_reply: String(settings.chat_price_reply ?? ""),
        newsletter_frequency: settings.newsletter_frequency,
        channel_fallback: settings.channel_fallback,
        types_enabled: settings.types_enabled,
      });
      setSettings(next);
      setMsg("Réglages enregistrés.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function saveTemplate(e: FormEvent) {
    e.preventDefault();
    if (!edit?.type || !edit.channel || !edit.body_template) return;
    setMsg("");
    try {
      if (edit.id) {
        await adminApi.updateNotificationTemplate(edit.id, {
          subject: edit.subject,
          body_template: edit.body_template,
          is_active: edit.is_active,
        });
      } else {
        await adminApi.saveNotificationTemplate(edit);
      }
      setEdit(null);
      await refresh();
      setMsg("Template enregistré.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  const typesEnabled = (settings.types_enabled || {}) as Record<string, boolean>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-brand-black">Notifications</h1>
      <p className="mt-1 text-sm text-brand-black/50">
        Templates, canaux, favoris, panier abandonné et signalements
      </p>
      {msg ? <p className="mt-3 text-sm font-medium text-brand-orange">{msg}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["settings", "Réglages"],
            ["templates", "Templates"],
            ["monitor", "Monitoring"],
            ["chats", "Chat produits"],
            ["reports", "Modération"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              tab === k ? "bg-brand-orange text-white" : "bg-white border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "settings" ? (
        <form onSubmit={saveSettings} className="mt-6 max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <label className="block text-sm">
            Seuil baisse de prix favoris (%)
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.price_drop_threshold_percent ?? 5)}
              onChange={(e) =>
                setSettings((s) => ({ ...s, price_drop_threshold_percent: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block text-sm">
            Délai regroupement anti-spam (minutes)
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.digest_minutes ?? 60)}
              onChange={(e) => setSettings((s) => ({ ...s, digest_minutes: Number(e.target.value) }))}
            />
          </label>
          <label className="block text-sm">
            Panier abandonné après (heures)
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.abandoned_cart_hours ?? 24)}
              onChange={(e) =>
                setSettings((s) => ({ ...s, abandoned_cart_hours: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block text-sm">
            Alerte fin de promo (heures avant)
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.promo_ending_hours ?? 24)}
              onChange={(e) =>
                setSettings((s) => ({ ...s, promo_ending_hours: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block text-sm">
            Limite signalements / heure
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.report_rate_limit_per_hour ?? 5)}
              onChange={(e) =>
                setSettings((s) => ({ ...s, report_rate_limit_per_hour: Number(e.target.value) }))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={Boolean(settings.push_enabled ?? true)}
              onChange={(e) => setSettings((s) => ({ ...s, push_enabled: e.target.checked }))}
            />
            Canal Web Push activé
          </label>

          <div className="rounded-xl border border-brand-black/10 bg-[#fafafa] p-4 space-y-3">
            <p className="text-sm font-bold">Chat produit → WhatsApp boutique</p>
            <label className="block text-sm">
              Numéro WhatsApp destinataire (indicatif inclus, ex. 221771234567)
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={String(settings.chat_whatsapp_number ?? "")}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    chat_whatsapp_number: e.target.value.replace(/\D/g, "").slice(0, 20),
                  }))
                }
                inputMode="numeric"
                placeholder="221771234567"
              />
              <span className="mt-1 block text-xs text-amber-800">
                En local, <code>SMS_DRIVER=log</code> : aucun SMS réel — le message est écrit dans les logs Laravel.
                Pour recevoir un vrai SMS, configurez Twilio (<code>SMS_DRIVER=twilio</code> + clés TWILIO_*).
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(settings.chat_forward_to_whatsapp ?? true)}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, chat_forward_to_whatsapp: e.target.checked }))
                }
              />
              Transférer chaque message chat vers ce numéro
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(settings.chat_auto_reply_enabled ?? true)}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, chat_auto_reply_enabled: e.target.checked }))
                }
              />
              Réponses automatiques (salutations / prix)
            </label>
            <label className="block text-sm">
              Message auto — salutation
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                rows={2}
                value={String(
                  settings.chat_greeting_reply ||
                    "Bonjour {{customer_name}} ! Merci pour votre intérêt pour {{product_name}}. Comment pouvons-nous vous aider ?"
                )}
                onChange={(e) => setSettings((s) => ({ ...s, chat_greeting_reply: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Message auto — prix article
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                rows={2}
                value={String(
                  settings.chat_price_reply ||
                    "{{product_name}} est à {{product_price}}. Souhaitez-vous plus d’infos ou un devis ?"
                )}
                onChange={(e) => setSettings((s) => ({ ...s, chat_price_reply: e.target.value }))}
              />
              <span className="mt-1 block text-xs text-brand-black/45">
                Variables : {"{{customer_name}}"}, {"{{product_name}}"}, {"{{product_price}}"}
              </span>
            </label>
          </div>

          <label className="block text-sm">
            Fréquence newsletter
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={String(settings.newsletter_frequency || "weekly")}
              onChange={(e) => setSettings((s) => ({ ...s, newsletter_frequency: e.target.value }))}
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </label>
          <div>
            <p className="text-sm font-semibold">Types activés</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {Object.keys(typesEnabled).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={typesEnabled[t] !== false}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        types_enabled: { ...typesEnabled, [t]: e.target.checked },
                      }))
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white">
            Enregistrer
          </button>
        </form>
      ) : null}

      {tab === "templates" ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-brand-black px-4 py-2 text-xs font-bold text-white"
              onClick={() =>
                setEdit({
                  type: types[0] || "order_placed",
                  channel: "email",
                  subject: "",
                  body_template: "",
                  is_active: true,
                })
              }
            >
              Nouveau template
            </button>
            <button
              type="button"
              className="rounded-full border bg-white px-4 py-2 text-xs font-bold"
              onClick={() =>
                adminApi.seedNotificationTemplates().then((r) => {
                  setMsg(`${r.seeded} templates seedés`);
                  return refresh();
                })
              }
            >
              Recharger les templates par défaut
            </button>
          </div>

          {edit ? (
            <form onSubmit={saveTemplate} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Type
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={edit.type || ""}
                    disabled={Boolean(edit.id)}
                    onChange={(e) => setEdit((x) => ({ ...x, type: e.target.value }))}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Canal
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={edit.channel || "email"}
                    disabled={Boolean(edit.id)}
                    onChange={(e) => setEdit((x) => ({ ...x, channel: e.target.value }))}
                  >
                    {channels.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-sm">
                Sujet (email)
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={edit.subject || ""}
                  onChange={(e) => setEdit((x) => ({ ...x, subject: e.target.value }))}
                />
              </label>
              <label className="mt-3 block text-sm">
                Corps (variables : {variables.map((v) => `{{${v}}}`).join(", ")})
                <textarea
                  rows={6}
                  className="mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs"
                  value={edit.body_template || ""}
                  onChange={(e) => setEdit((x) => ({ ...x, body_template: e.target.value }))}
                />
              </label>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={edit.is_active !== false}
                  onChange={(e) => setEdit((x) => ({ ...x, is_active: e.target.checked }))}
                />
                Actif
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white">
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 text-xs font-bold"
                  onClick={() =>
                    adminApi
                      .previewNotificationTemplate({
                        subject: edit.subject,
                        body_template: edit.body_template,
                      })
                      .then(setPreview)
                  }
                >
                  Prévisualiser
                </button>
                <button type="button" className="rounded-full border px-4 py-2 text-xs font-bold" onClick={() => setEdit(null)}>
                  Annuler
                </button>
              </div>
              {preview ? (
                <div className="mt-4 rounded-xl bg-[#f7f7f7] p-4 text-sm">
                  <p className="font-bold">{preview.subject}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{preview.body}</pre>
                </div>
              ) : null}
            </form>
          ) : null}

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-brand-black/45">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Sujet</th>
                  <th className="px-4 py-3">Actif</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium">{t.type}</td>
                    <td className="px-4 py-3">{t.channel}</td>
                    <td className="px-4 py-3">{t.subject || "—"}</td>
                    <td className="px-4 py-3">{t.is_active ? "Oui" : "Non"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs font-bold text-brand-orange"
                        onClick={() => setEdit(t)}
                      >
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "monitor" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold">7 derniers jours</h2>
            <p className="mt-2 text-3xl font-extrabold text-brand-orange">{stats?.sent_7d ?? 0}</p>
            <p className="text-xs text-brand-black/45">envois réussis</p>
            <p className="mt-4 text-lg font-bold text-red-600">{stats?.failed_7d ?? 0} échecs</p>
            <div className="mt-4 space-y-1 text-sm">
              {Object.entries(stats?.by_channel || {}).map(([k, v]) => (
                <p key={k}>
                  {k}: <strong>{v}</strong>
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold">File d’échec</h2>
            <ul className="mt-3 space-y-3">
              {failed.length === 0 ? (
                <li className="text-sm text-brand-black/45">Aucun échec récent.</li>
              ) : (
                failed.map((f) => (
                  <li key={f.id} className="rounded-xl border border-black/5 p-3 text-sm">
                    <p className="font-semibold">
                      {f.type} · {f.channel}
                    </p>
                    <p className="text-xs text-brand-black/50">{f.recipient}</p>
                    <p className="mt-1 text-xs text-red-600">{f.error}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-bold text-brand-orange"
                      onClick={() =>
                        adminApi.resendFailedNotification(f.id).then(() => {
                          setMsg("Renvoi planifié");
                          return refresh();
                        })
                      }
                    >
                      Renvoyer
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "chats" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto rounded-2xl bg-white p-3 shadow-sm">
            {chats.length === 0 ? (
              <li className="px-2 py-8 text-center text-sm text-brand-black/45">Aucun chat</li>
            ) : (
              chats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      setActiveChatId(c.id);
                      const res = await adminApi.getProductChatMessages(c.id);
                      setChatMessages(res.data || []);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f7f7f7] ${
                      activeChatId === c.id ? "bg-brand-orange/10" : ""
                    }`}
                  >
                    <p className="font-semibold">{c.product?.name || `Chat #${c.id}`}</p>
                    <p className="text-xs text-brand-black/45">
                      {c.customer?.name || c.customer?.phone || "Client"}
                      {c.unread_count ? ` · ${c.unread_count} non lu(s)` : ""}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex min-h-[24rem] flex-col rounded-2xl bg-white p-4 shadow-sm">
            {!activeChatId ? (
              <p className="m-auto text-sm text-brand-black/45">Sélectionnez une conversation</p>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender_type === "admin"
                          ? "ml-auto bg-brand-orange text-white"
                          : "bg-[#f3f3f3]"
                      }`}
                    >
                      {m.body}
                    </div>
                  ))}
                </div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!activeChatId || !chatReply.trim()) return;
                    await adminApi.replyProductChat(activeChatId, chatReply.trim());
                    setChatReply("");
                    const res = await adminApi.getProductChatMessages(activeChatId);
                    setChatMessages(res.data || []);
                    await refresh();
                  }}
                >
                  <input
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    className="flex-1 rounded-full border px-3 py-2 text-sm"
                    placeholder="Répondre au client…"
                  />
                  <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
                    Envoyer
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-brand-black/45">
                <th className="px-4 py-3">Raison</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-brand-black/45">
                    Aucun signalement
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-black/5">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.reason}</p>
                      <p className="text-xs text-brand-black/45">{r.details}</p>
                    </td>
                    <td className="px-4 py-3">{r.customer?.name || r.customer?.phone || "—"}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border px-2 py-1 text-xs"
                        value={r.status}
                        onChange={(e) =>
                          adminApi.updateContentReport(r.id, e.target.value).then(() => refresh())
                        }
                      >
                        <option value="new">Nouveau</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Résolu</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
