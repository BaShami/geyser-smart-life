import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const NOTIFY_EMAIL = "timothy.s@bookestyle.com";

type Patch = {
  device_interests?: string[];
  country?: string | null;
  city?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  owns_or_rents?: string | null;
  has_wifi?: boolean | null;
  current_step?: string | null;
  last_completed_step?: string | null;
  lead_status?: string | null;
  transcript?: unknown;
};

type Body = {
  session_id?: string;
  patch?: Patch;
  first_utm?: unknown;
  latest_utm?: unknown;
  referrer?: string | null;
};

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v === "" || v === null) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export const Route = createFileRoute("/api/lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }
        if (!body.session_id || !body.patch) {
          return Response.json({ error: "missing" }, { status: 400 });
        }
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return Response.json({ error: "no_db" }, { status: 500 });
        const admin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const patch = stripEmpty(body.patch);

        // Look up existing row
        const { data: existing } = await admin
          .from("leads")
          .select("id, phone, email, notified_at, name, city, country, device_interests")
          .eq("session_id", body.session_id)
          .maybeSingle();

        const now = new Date().toISOString();
        let row: { id: string; phone: string | null; email: string | null; notified_at: string | null } | null = null;

        if (existing) {
          const update: Record<string, unknown> = {
            ...patch,
            last_seen_at: now,
          };
          const { data, error } = await admin
            .from("leads")
            .update(update)
            .eq("id", existing.id)
            .select("id, phone, email, notified_at")
            .maybeSingle();
          if (error) {
            console.error("[lead] update", error);
            return Response.json({ error: "db" }, { status: 500 });
          }
          row = data;
        } else {
          const insert: Record<string, unknown> = {
            session_id: body.session_id,
            first_utm: body.first_utm ?? null,
            latest_utm: body.latest_utm ?? null,
            referrer: body.referrer ?? null,
            first_seen_at: now,
            last_seen_at: now,
            ...patch,
          };
          const { data, error } = await admin
            .from("leads")
            .insert(insert)
            .select("id, phone, email, notified_at")
            .maybeSingle();
          if (error) {
            console.error("[lead] insert", error);
            return Response.json({ error: "db" }, { status: 500 });
          }
          row = data;
        }

        // Notify once on first valid phone or email
        if (row && !row.notified_at && (row.phone || row.email)) {
          try {
            await sendTemplateEmail("lead-notification", NOTIFY_EMAIL, {
              templateData: {
                name: patch.name ?? existing?.name ?? null,
                contact: row.phone ?? row.email ?? null,
                city: patch.city ?? existing?.city ?? null,
                hasGeyser: null,
                hasWifi: patch.has_wifi ?? null,
                isRenter: patch.owns_or_rents === "rent" ? true : patch.owns_or_rents === "own" ? false : null,
                transcript: [],
              },
              idempotencyKey: `new-lead-${row.id}`,
            });
            await admin.from("leads").update({ notified_at: now }).eq("id", row.id);
          } catch (err) {
            console.warn("[lead] notify error", err);
          }
        }

        return Response.json({ id: row?.id ?? null });
      },
    },
  },
});
