import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Body = {
  session_id?: string;
  event_name?: string;
  funnel_step?: string;
  selected_device?: string | null;
  country?: string | null;
  referrer?: string | null;
  utm?: unknown;
  metadata?: unknown;
  lead_id?: string | null;
};

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (!body.session_id || !body.event_name) {
          return new Response("missing", { status: 400 });
        }
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return new Response("no db", { status: 500 });
        const admin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await admin.from("analytics_events").insert({
          session_id: body.session_id,
          lead_id: body.lead_id ?? null,
          event_name: body.event_name.slice(0, 64),
          funnel_step: body.funnel_step?.slice(0, 64) ?? null,
          selected_device: body.selected_device ?? null,
          country: body.country ?? null,
          referrer: body.referrer ?? null,
          utm: body.utm ?? null,
          metadata: body.metadata ?? null,
        });
        return new Response("ok");
      },
    },
  },
});
