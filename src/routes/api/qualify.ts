import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };
type Mode = "qualify" | "waitlist";

type Extracted = {
  hasGeyser: boolean | null;
  hasWifi: boolean | null;
  city: string | null;
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
const HARD_CAP = 6;

function qualifySystemPrompt(extracted: Extracted, userTurns: number) {
  const missing: string[] = [];
  if (extracted.hasGeyser === null) missing.push("whether they have a geyser");
  if (extracted.hasWifi === null) missing.push("whether they have Wi-Fi at home");

  const known = Object.entries(extracted)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ") || "nothing yet";

  return `You are the GeyserBrain qualifying assistant. GeyserBrain is a smart-home service that lets people control their geyser via WhatsApp — the first device we bring online, with more on the roadmap.

Your job is to have a natural, warm conversation to find out two things:
1. Do they have a geyser?
2. Do they have Wi-Fi at home?

Do NOT ask about location, city, or country. Do not mention any city, region, or country. Availability by area is handled separately.

RULES:
- Keep replies SHORT (1–2 sentences). Cost matters.
- Ask about only ONE missing thing at a time, phrased naturally — never a checklist.
- If they already stated something, do NOT ask again.
- If they ask an off-topic question (pricing, install time, solar, refunds, renter, roadmap, etc.), answer briefly then gently return to the missing qualifier.
- Tone: calm, brief, human. No emojis. No exclamation marks unless celebrating a fit.
- If they are a renter, mention: "Since you rent, you'll want your landlord or body corporate's OK before installation." Then continue.
- If the visitor asks whether we're available where they live, do NOT confirm or deny — set status="waitlist" and offer to add them to the waitlist (ask for name + email).

FAQ you can draw from (be brief):
- Devices today: geyser only — your home's biggest electricity cost. More devices are on our roadmap.
- Pricing: shown on the site; monthly is very low.
- Install: ~1 hour by a certified electrician.
- Solar/inverter homes: works fine, we integrate around your existing setup.
- Refund: full refund if you don't qualify or aren't satisfied.

DECISION LOGIC:
- If BOTH (geyser + wifi) are confirmed → status="qualified" and reply warmly. If you don't have their name yet, ask for it.
- If you already have name+contact after qualifying → status="done_qualified".
- If you already have name+email for waitlist → status="done_waitlist".
- Otherwise → status="asking".

CURRENT STATE:
- Already known: ${known}
- Still missing: ${missing.length ? missing.join(", ") : "nothing — decide outcome now"}
- User turns so far: ${userTurns} of ${HARD_CAP} max.
${userTurns >= HARD_CAP - 1 ? "- HARD CAP REACHED: decide now. If unresolved, treat as waitlist and ask for name+email." : ""}

OUTPUT: return ONLY a compact JSON object, no prose, no code fences:
{"reply": string, "extracted": {"hasGeyser": bool|null, "hasWifi": bool|null, "city": null, "isRenter": bool|null, "name": string|null, "contact": string|null, "email": string|null}, "status": "asking"|"qualified"|"waitlist"|"done_qualified"|"done_waitlist"}
Merge new info with what's already known; never overwrite known values with null. Always leave city as null.`;
}

function waitlistSystemPrompt(extracted: Extracted, userTurns: number) {
  const known = Object.entries(extracted)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ") || "nothing yet";
  const missing: string[] = [];
  if (!extracted.name) missing.push("their name");
  if (!extracted.email) missing.push("their email address");

  return `You are the GeyserBrain waitlist assistant. The visitor wants to be notified when we launch in their area.

Your only job is to collect their NAME and EMAIL, warmly and briefly. Do not ask about geyser, Wi-Fi, city, or country.

RULES:
- Very short replies (1 sentence).
- Ask for one missing thing at a time.
- Never mention any city, region, or country.
- If they ask something off-topic, answer briefly from FAQ, then return to the missing detail.

FAQ (brief):
- We're expanding steadily; joining the waitlist means we'll message you the moment we're live in your area.
- Devices today: geyser. More on the roadmap.

DECISION LOGIC:
- Once you have BOTH name and email → status="done_waitlist" and reply warmly confirming they're on the list.
- Otherwise → status="waitlist".

CURRENT STATE:
- Already known: ${known}
- Still missing: ${missing.length ? missing.join(", ") : "nothing — confirm and set status=done_waitlist"}
- User turns so far: ${userTurns} of ${HARD_CAP} max.

OUTPUT: return ONLY a compact JSON object, no prose, no code fences:
{"reply": string, "extracted": {"hasGeyser": null, "hasWifi": null, "city": null, "isRenter": null, "name": string|null, "contact": string|null, "email": string|null}, "status": "waitlist"|"done_waitlist"}
Never overwrite known values with null.`;
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
  hasGeyser: boolean | null;
  hasWifi: boolean | null;
  isRenter: boolean | null;
  transcript: Msg[];
}) {
  try {
    await sendTemplateEmail("lead-notification", NOTIFY_EMAIL, {
      templateData: payload,
      idempotencyKey: `lead-${payload.contact ?? payload.name ?? crypto.randomUUID()}-${Date.now()}`,
    });
  } catch (err) {
    console.warn("[qualify] notify email error", err);
  }
}

export const Route = createFileRoute("/api/qualify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          messages?: Msg[];
          extracted?: Extracted;
          mode?: Mode;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        const prevExtracted = { ...EMPTY, ...(body.extracted ?? {}) };
        const mode: Mode = body.mode === "waitlist" ? "waitlist" : "qualify";
        const userTurns = messages.filter((m) => m.role === "user").length;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "missing_key" }, { status: 500 });
        }

        const system = mode === "waitlist"
          ? waitlistSystemPrompt(prevExtracted, userTurns)
          : qualifySystemPrompt(prevExtracted, userTurns);

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
              { role: "system", content: system },
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
        if (userTurns >= HARD_CAP && (status === "asking" || status === "waitlist")) {
          if (mode === "qualify" && merged.hasGeyser && merged.hasWifi) {
            status = "qualified";
          } else if (merged.name && merged.email) {
            status = "done_waitlist";
          } else {
            status = "waitlist";
          }
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
                  city: null,
                  has_geyser: merged.hasGeyser,
                  has_wifi: merged.hasWifi,
                  is_renter: merged.isRenter,
                  transcript,
                });
                await sendNotifyEmail({
                  name: merged.name,
                  contact: merged.contact,
                  city: null,
                  hasGeyser: merged.hasGeyser,
                  hasWifi: merged.hasWifi,
                  isRenter: merged.isRenter,
                  transcript,
                });
              } else {
                await admin.from("qualify_waitlist").insert({
                  name: merged.name,
                  email: merged.email,
                  city: null,
                  reason: mode === "waitlist" ? "availability_request" : "unresolved",
                  transcript,
                });
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
