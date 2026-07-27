import { createFileRoute } from "@tanstack/react-router";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

const SYSTEM = `You are the GeyserBrain assistant. GeyserBrain is a WhatsApp-based smart-home service.

STRICT SCOPE — only answer about:
- Supported devices (lights, geysers, plugs & appliances — all available now; gates & security by custom assessment)
- Availability (South Africa, Zimbabwe, Zambia — all operational; installation subject to installer coverage in the specific area; other countries: check availability)
- Pricing and payment options (pay once or 4 monthly instalments; the instalment plan covers hardware and installation only)
- Installation (~1–2 hours, certified electrician)
- Compatibility (works with solar and inverter setups)
- Wi-Fi requirement (yes, home Wi-Fi is required)
- Privacy, support, quotes, scheduling and automation, energy usage reports

RULES:
- Maximum two SHORT sentences per reply.
- Ask only one question at a time.
- Never repeat information already captured about the user.
- Never claim unsupported device compatibility.
- Never describe Zimbabwe or Zambia as unavailable or waitlist.
- Never send anyone in South Africa, Zimbabwe or Zambia to a waitlist.
- Do NOT try to validate phone numbers or emails.
- Prefer directing the user to tap a device tile or the WhatsApp button to complete their request.
- If asked anything outside the scope above, reply exactly: "I can only help with GeyserBrain smart-home questions. Which device would you like to control?"

Return JSON only: {"reply": string}`;

export const Route = createFileRoute("/api/qualify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { messages?: Msg[]; context?: { device?: string | null; country?: string | null } };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }

        const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
        const ctx = body.context ?? {};
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "missing_key" }, { status: 500 });

        const contextLine = `KNOWN CONTEXT: device=${ctx.device ?? "unknown"}, country=${ctx.country ?? "unknown"}.`;

        const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            temperature: 0.4,
            max_tokens: 180,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM },
              { role: "system", content: contextLine },
              ...messages,
            ],
          }),
        });

        if (!llmRes.ok) {
          const code = llmRes.status;
          const message =
            code === 429
              ? "We're getting a lot of interest right now. Try again in a moment."
              : "Something went wrong. Please message us on WhatsApp.";
          return Response.json({ reply: message }, { status: 200 });
        }

        const data = (await llmRes.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = data.choices?.[0]?.message?.content ?? "";
        let reply = "I can only help with GeyserBrain smart-home questions. Which device would you like to control?";
        try {
          const parsed = JSON.parse(raw) as { reply?: string };
          if (parsed?.reply && typeof parsed.reply === "string") reply = parsed.reply.trim();
        } catch {}
        return Response.json({ reply });
      },
    },
  },
});
