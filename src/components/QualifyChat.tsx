import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { track } from "@/lib/session";
import type { DeviceId, CountryCode } from "@/lib/pricing";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Props = {
  device: DeviceId | null;
  country: CountryCode;
};

const OPENER = "Ask me anything about HomeChat — devices, pricing or install.";

export function QualifyChat({ device, country }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: OPENER },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setSending(true);
    track({
      event_name: "ai_question_asked",
      funnel_step: "ai",
      selected_device: device,
      country,
    });
    try {
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: { device, country },
        }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages([
        ...next,
        { role: "assistant", content: data.reply ?? "Please message us on WhatsApp." },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Connection issue. Please message us on WhatsApp." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-soft overflow-hidden">
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto px-4 py-4 space-y-2 text-sm"
        style={{ backgroundColor: "#ECE5DD" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed shadow-sm"
              style={{
                backgroundColor: m.role === "user" ? "#DCF8C6" : "#FFFFFF",
                color: "#111b21",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="text-xs text-neutral-500 pl-1">typing…</div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-black/10 px-3 py-3"
        style={{ backgroundColor: "#F0F2F5" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          placeholder="Ask about pricing, install, devices…"
          className="flex-1 rounded-full px-4 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40"
          style={{ backgroundColor: "#25D366" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
