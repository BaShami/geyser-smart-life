import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };
type Status = "asking" | "qualified" | "waitlist" | "done_qualified" | "done_waitlist";

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

const OPENER_QUALIFY = "Hey — I'm here to check if we can help. What's going on with your place?";
const OPENER_WAITLIST = "Sure — I can add you to the waitlist and let you know when we're live in your area. What's your name?";
const WA_NUMBER = "27744224646";
const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export function QualifyChat({ active, mode = "qualify" }: { active: boolean; mode?: Mode }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: mode === "waitlist" ? OPENER_WAITLIST : OPENER_QUALIFY },
  ]);
  const [extracted, setExtracted] = useState<Extracted>({
    hasGeyser: null,
    hasWifi: null,
    city: null,
    isRenter: null,
    name: null,
    contact: null,
    email: null,
  });
  const [status, setStatus] = useState<Status>("asking");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, status]);

  useEffect(() => {
    if (active) {
      // small delay to let scroll finish
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [active]);

  const done = status === "done_qualified" || status === "done_waitlist";

  async function send() {
    const text = input.trim();
    if (!text || sending || done) return;
    setError(null);
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setSending(true);
    try {
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, extracted, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try WhatsApp.");
        return;
      }
      setExtracted(data.extracted);
      setStatus(data.status);
      setMessages([...nextMsgs, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setError("Connection issue. Please try WhatsApp.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const showWa = status === "qualified" || status === "done_qualified";
  const waMessage = extracted.name
    ? `Hi, I'm ${extracted.name} — I qualified on your site and I'd like to get started.`
    : "Hi, I qualified on your site and I'd like to get started.";

  return (
    <div className="rounded-3xl border border-black/10 shadow-soft overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: "#075E54", color: "#ffffff" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "#25D366", color: "#075E54" }}>
          GB
        </div>
        <div>
          <div className="text-sm font-medium leading-tight">GeyserBrain</div>
          <div className="text-[11px] opacity-80 leading-tight">
            {done ? "conversation ended" : "online · usually replies in seconds"}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[380px] sm:h-[420px] overflow-y-auto px-4 sm:px-5 py-5 space-y-2"
        style={{
          backgroundColor: "#ECE5DD",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                m.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
              style={
                m.role === "user"
                  ? { backgroundColor: "#DCF8C6", color: "#111b21" }
                  : { backgroundColor: "#ffffff", color: "#111b21" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 shadow-sm" style={{ backgroundColor: "#ffffff" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#25D366" }} />
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#25D366", animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#25D366", animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 pl-1">{error}</div>
        )}
      </div>

      {showWa && (
        <div className="px-4 sm:px-5 py-4 border-t border-black/10" style={{ backgroundColor: "#ffffff" }}>
          <a
            href={wa(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium shadow-soft hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: "#25D366", color: "#ffffff" }}
          >
            Continue on WhatsApp
          </a>
        </div>
      )}

      {!done && (
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
            placeholder="Type a message"
            className="flex-1 rounded-full px-4 py-2.5 text-sm focus:outline-none"
            style={{ backgroundColor: "#ffffff", color: "#111b21" }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: "#25D366", color: "#ffffff" }}
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
