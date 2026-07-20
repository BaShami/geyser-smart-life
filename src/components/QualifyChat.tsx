import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };
type Status = "asking" | "qualified" | "waitlist" | "done_qualified" | "done_waitlist";

type Extracted = {
  hasGeyser: boolean | null;
  hasWifi: boolean | null;
  city: "pretoria" | "johannesburg" | "other" | null;
  isRenter: boolean | null;
  name: string | null;
  contact: string | null;
  email: string | null;
};

const OPENER = "Hey — I'm here to check if we can help. What's going on with your place?";
const WA_NUMBER = "27744224646";
const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export function QualifyChat({ active }: { active: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: OPENER },
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
        body: JSON.stringify({ messages: nextMsgs, extracted }),
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
    <div className="rounded-3xl border border-border/60 bg-background shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <div className="text-sm font-medium">GeyserBrain</div>
        <div className="text-xs text-muted-foreground ml-auto">
          {done ? "Done" : "usually replies in seconds"}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[380px] sm:h-[420px] overflow-y-auto px-4 sm:px-5 py-5 space-y-3 bg-secondary/30"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-background text-foreground border border-border/60 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-background border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 pl-1">{error}</div>
        )}
      </div>

      {showWa && (
        <div className="px-4 sm:px-5 py-4 border-t border-border/60 bg-background">
          <a
            href={wa(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-medium shadow-soft hover:-translate-y-0.5 transition-all"
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
          className="flex items-center gap-2 border-t border-border/60 bg-background px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Type your reply…"
            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
