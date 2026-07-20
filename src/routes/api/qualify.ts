import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Extracted = {
  hasGeyser: boolean | null;
  hasWifi: boolean | null;
  city: "pretoria" | "johannesburg" | "other" | null;
  isRenter: boolean | null;
  name: string | null;
  contact: string | null;
  email: string | null;
};

type Status = "asking" | "qualified" | "waitlist" | "done_qualified" | "done_waitlist";

const EMPTY: Extracted = {
  hasGeyser: null,
  hasWifi: null,
  city: null,
  isRenter: null,
  name: null,
  contact: null,
  email: null,
};

const NOTIFY_EMAIL = "timothy.s@bookestyle.com";
const HARD_CAP = 6; // max user turns before we force a decision

function systemPrompt(extracted: Extracted, userTurns: number) {
  const missing: string[] = [];
  if (extracted.hasGeyser === null) missing.push("whether they have a geyser");
  if (extracted.hasWifi === null) missing.push("whether they have Wi-Fi at home");
  if (extracted.city === null) missing.push("where they live (Pretoria, Johannesburg, or elsewhere)");

  const known = Object.entries(extracted)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ") || "nothing yet";

  return `You are the GeyserBrain qualifying assistant. GeyserBrain is a smart-home service in South Africa that lets people control their geyser via WhatsApp. It currently only serves Pretoria and Johannesburg.

Your job is to have a natural, warm conversation to find out three things:
1. Do they have a geyser?
2. Do they have Wi-Fi at home?
3. Do they live in Pretoria or Johannesburg?

RULES:
- Keep replies SHORT (1–2 sentences). Cost matters.
- Ask about only ONE missing thing at a time, phrased naturally — never a checklist.
- If they already stated something, do NOT ask again.
- If they ask an off-topic question (pricing, install time, solar, refunds, renter, etc.), answer briefly then gently return to the missing qualifier.
- Tone: calm, brief, human. No emojis. No exclamation marks unless celebrating a fit.
- If they are a renter, mention: "Since you rent, you'll want your landlord or body corporate's OK before installation." Then continue.

FAQ you can draw from (be brief):
- Pricing: R199/month for founding 10 members, includes device + install. Normally R249/month.
- Install: ~1 hour by a certified electrician.
- Solar/inverter homes: works fine, we integrate around your existing setup.
- Refund: full refund if you don't qualify or aren't satisfied in the first 30 days.
- Coverage: only Pretoria & Johannesburg right now, expanding later.

DECISION LOGIC:
- If all three (geyser + wifi + city in Pretoria/Johannesburg) are confirmed → status="qualified" and reply warmly, mention we're a great fit and that they can continue on WhatsApp. If you don't have their name yet, ask for it in the reply.
- If city is "other" (not Pretoria or Johannesburg) → status="waitlist". Reply: gently explain we're only in Pretoria & Johannesburg for now, and offer to add them to the waitlist. Ask for their name and email.
- If you already have name+contact after qualifying → status="done_qualified".
- If you already have name+email for waitlist → status="done_waitlist".
- Otherwise → status="asking".

CURRENT STATE:
- Already known: ${known}
- Still missing: ${missing.length ? missing.join(", ") : "nothing — decide outcome now"}
- User turns so far: ${userTurns} of ${HARD_CAP} max.
${userTurns >= HARD_CAP - 1 ? "- HARD CAP REACHED: decide now. If unresolved, treat as waitlist and ask for name+email." : ""}

OUTPUT: return ONLY a compact JSON object, no prose, no code fences:
{"reply": string, "extracted": {"hasGeyser": bool|null, "hasWifi": bool|null, "city": "pretoria"|"johannesburg"|"other"|null, "isRenter": bool|null, "name": string|null, "contact": string|null, "email": string|null}, "status": "asking"|"qualified"|"waitlist"|"done_qualified"|"done_waitlist"}
Merge new info with what's already known; never overwrite known values with null.`;
}

function safeParse(text: string): {
  reply: string;
  extracted: Extracted;
  status: Status;
} | null {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, "");
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return {
      reply: String(parsed.reply ?? ""),
      extracted: { ...EMPTY, ...(parsed.extracted ?? {}) },
      status: (parsed.status ?? "asking") as Status,
    };
  } catch {
    return null;
  }
}

function mergeExtracted(prev: Extracted, next: Extracted): Extracted {
  const out = { ...prev };
  (Object.keys(next) as (keyof Extracted)[]).forEach((k) => {
    const v = next[k];
    if (v !== null && v !== undefined && v !== "") {
      (out as Record<string, unknown>)[k] = v;
    }
  });
  return out;
}

async function sendNotifyEmail(payload: {
  name: string | null;
  contact: string | null;
  city: string | null;
  transcript: Msg[];
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return;
  const body = {
    to: NOTIFY_EMAIL,
    subject: `New GeyserBrain lead: ${payload.name ?? "unnamed"} (${payload.city ?? "?"})`,
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#111">
      <h2 style="margin:0 0 12px">New qualified lead</h2>
      <p><b>Name:</b> ${payload.name ?? "(not given)"}<br/>
      <b>Contact:</b> ${payload.contact ?? "(not given)"}<br/>
      <b>City:</b> ${payload.city ?? "(unknown)"}</p>
      <h3 style="margin:20px 0 8px">Transcript</h3>
      <div style="border:1px solid #eee;border-radius:8px;padding:12px;background:#fafafa">
        ${payload.transcript
          .map(
            (m) =>
              `<p style="margin:6px 0"><b>${m.role === "user" ? "Visitor" : "Bot"}:</b> ${escapeHtml(
                m.content,
              )}</p>`,
          )
          .join("")}
      </div>
    </div>`,
  };
  try {
    // Managed Lovable email endpoint. Requires an email domain to be configured
    // in the project — until then it will return an error and we log silently.
    const res = await fetch("https://api.lovable.dev/v1/emails/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[qualify] notify email failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("[qualify] notify email error", err);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/api/qualify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          messages?: Msg[];
          extracted?: Extracted;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        const prevExtracted = { ...EMPTY, ...(body.extracted ?? {}) };
        const userTurns = messages.filter((m) => m.role === "user").length;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "missing_key" }, { status: 500 });
        }

        const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-lite",
            temperature: 0.6,
            max_tokens: 300,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt(prevExtracted, userTurns) },
              ...messages,
            ],
          }),
        });

        if (!llmRes.ok) {
          const errText = await llmRes.text().catch(() => "");
          console.error("[qualify] llm error", llmRes.status, errText);
          const code = llmRes.status;
          const message =
            code === 429
              ? "We're getting a lot of interest right now. Try again in a moment."
              : code === 402
                ? "The service is temporarily unavailable. Please message us on WhatsApp."
                : "Something went wrong. Please message us on WhatsApp.";
          return Response.json({ error: "llm_error", message }, { status: 502 });
        }

        const data = (await llmRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = data.choices?.[0]?.message?.content ?? "";
        const parsed = safeParse(raw);

        if (!parsed) {
          return Response.json({
            reply: "Sorry — could you say that again?",
            extracted: prevExtracted,
            status: "asking" as Status,
          });
        }

        const merged = mergeExtracted(prevExtracted, parsed.extracted);
        let status = parsed.status;

        // Hard cap safety net
        if (userTurns >= HARD_CAP && status === "asking") {
          status = merged.city && merged.city !== "other" && merged.hasGeyser && merged.hasWifi
            ? "qualified"
            : "waitlist";
        }

        // Persist terminal states
        if (status === "done_qualified" || status === "done_waitlist") {
          const supabaseUrl = process.env.SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (supabaseUrl && serviceKey) {
            const admin = createClient(supabaseUrl, serviceKey, {
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const transcript = [...messages, { role: "assistant" as Role, content: parsed.reply }];
            try {
              if (status === "done_qualified") {
                await admin.from("qualify_leads").insert({
                  name: merged.name,
                  contact: merged.contact,
                  city: merged.city,
                  has_geyser: merged.hasGeyser,
                  has_wifi: merged.hasWifi,
                  is_renter: merged.isRenter,
                  transcript,
                });
                await sendNotifyEmail({
                  name: merged.name,
                  contact: merged.contact,
                  city: merged.city,
                  transcript,
                });
              } else {
                await admin.from("qualify_waitlist").insert({
                  name: merged.name,
                  email: merged.email,
                  city: merged.city,
                  reason:
                    merged.city && merged.city !== "pretoria" && merged.city !== "johannesburg"
                      ? "out_of_area"
                      : "unresolved",
                  transcript,
                });
                // Waitlist entries are batched — no per-entry email.
              }
            } catch (err) {
              console.error("[qualify] persist error", err);
            }
          }
        }

        return Response.json({
          reply: parsed.reply,
          extracted: merged,
          status,
        });
      },
    },
  },
});
