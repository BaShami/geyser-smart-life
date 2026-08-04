import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Body = {
  session_id?: string;
  full_name?: string;
  whatsapp_number?: string;
  country?: string;
  runs_household?: string;
  household_whatsapp_users?: string;
  follow_up_with?: string;
  repeated_responsibility?: string;
  frequency?: string;
  would_invite?: string;
  referrer?: string | null;
  utm?: unknown;
};

const clip = (v: unknown, n = 300) => (typeof v === "string" ? v.trim().slice(0, n) : null);

export const Route = createFileRoute("/api/household-pilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }

        const full_name = clip(body.full_name, 120);
        const whatsapp_number = clip(body.whatsapp_number, 40);
        if (!full_name || !whatsapp_number) {
          return Response.json({ error: "missing_fields" }, { status: 400 });
        }

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return Response.json({ error: "no_db" }, { status: 500 });

        const admin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data, error } = await admin
          .from("household_pilot_signups")
          .insert({
            session_id: clip(body.session_id, 80),
            full_name,
            whatsapp_number,
            country: clip(body.country, 60),
            runs_household: clip(body.runs_household, 40),
            household_whatsapp_users: clip(body.household_whatsapp_users, 40),
            follow_up_with: clip(body.follow_up_with, 60),
            repeated_responsibility: clip(body.repeated_responsibility, 500),
            frequency: clip(body.frequency, 40),
            would_invite: clip(body.would_invite, 20),
            referrer: clip(body.referrer, 300),
            utm: body.utm ?? null,
          })
          .select("id")
          .single();

        if (error) return Response.json({ error: "insert_failed" }, { status: 500 });
        return Response.json({ id: data?.id ?? null });
      },
    },
  },
});
