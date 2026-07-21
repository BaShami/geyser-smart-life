import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MessageCircle, Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import electricianImg from "@/assets/electrician.jpg";
import homeImg from "@/assets/home.jpg";
import reactionVideo from "@/assets/reaction.mp4.asset.json";
import logoAsset from "@/assets/geyserbrain-logo.png";
import { QualifyChat } from "@/components/QualifyChat";

export const Route = createFileRoute("/")({
  component: Landing,
});

import { useCurrency } from "@/hooks/use-currency";

const WA_NUMBER = "27744224646";
const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

// Timothy: set to the exact second in reaction.mp4 where the visible reaction happens.
// Until set, the bloom triggers when message 4 ("Done. It's heating now.") appears.
const REACTION_TIMESTAMP: number | null = null;

/* ---------- primitives ---------- */

function PillLink({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "light" | "ghost";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-soft hover:shadow-float"
      : variant === "light"
        ? "bg-white text-black shadow-float hover:shadow-float"
        : "bg-transparent text-foreground border border-border/70 hover:bg-secondary";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </a>
  );
}

/* ---------- Reveal ---------- */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[350ms] ease-out motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- WhatsApp demo + reaction video ---------- */

type Msg = { from: "me" | "them"; text: string };
const SCRIPT: Msg[] = [
  { from: "me", text: "Is the geyser on right now?" },
  { from: "them", text: "It's off at the moment." },
  { from: "me", text: "Switch it on — I need a shower." },
  { from: "them", text: "Done. It's heating now." },
  { from: "me", text: "Can you have it ready every weekday at 6am too?" },
  { from: "them", text: "Got it — set for every weekday at 6am." },
];
const TIMES = ["09:41", "09:41", "09:42", "09:42", "09:43", "09:43"];
const REACTION_MSG_INDEX = 3;

type Step = { type: "delay"; ms: number } | { type: "typing"; on: boolean } | { type: "send"; index: number };

function buildSteps(): Step[] {
  const s: Step[] = [];
  SCRIPT.forEach((m, i) => {
    if (m.from === "them") {
      s.push({ type: "delay", ms: 500 });
      s.push({ type: "typing", on: true });
      s.push({ type: "delay", ms: 900 });
      s.push({ type: "typing", on: false });
    }
    s.push({ type: "delay", ms: 300 });
    s.push({ type: "send", index: i });
    s.push({ type: "delay", ms: 900 });
  });
  return s;
}
const STEPS = buildSteps();

function DoubleCheck({ read }: { read: boolean }) {
  return (
    <svg
      viewBox="0 0 16 15"
      className={`w-[14px] h-[10px] ${read ? "text-[#53BDEB]" : "text-neutral-400"}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M10.91 3.316l-.478-.372a.365.365 0 00-.51.063L4.566 9.879a.32.32 0 01-.484.033L1.891 7.769a.366.366 0 00-.515.006l-.423.433a.364.364 0 00.006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 00-.063-.51z" />
      <path d="M15.61 3.316l-.478-.372a.365.365 0 00-.51.063L9.32 9.879a.32.32 0 01-.484.033l-.358-.325a.365.365 0 00-.484.032l-.372.472a.364.364 0 00.032.516l1.19 1.081c.144.14.362.125.484-.033l6.272-8.048a.365.365 0 00-.064-.51z" />
    </svg>
  );
}

function DemoBlock({
  onBloom,
  soundArmedRef,
}: {
  onBloom: () => void;
  soundArmedRef: React.MutableRefObject<boolean>;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [visibleIdx, setVisibleIdx] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const [bloomedLocal, setBloomedLocal] = useState(false);
  const [reduce, setReduce] = useState(false);

  const stepIRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStartedAtRef = useRef(0);
  const timerRemainingRef = useRef(0);
  const startedOnceRef = useRef(false);
  const bloomedRef = useRef(false);

  const triggerBloom = useCallback(() => {
    if (bloomedRef.current) return;
    bloomedRef.current = true;
    setBloomedLocal(true);
    setShowCaption(true);
    onBloom();
  }, [onBloom]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const runStep = useCallback(() => {
    while (stepIRef.current < STEPS.length) {
      const step = STEPS[stepIRef.current++];
      if (step.type === "typing") {
        setTyping(step.on);
        continue;
      }
      if (step.type === "send") {
        const idx = step.index;
        setVisibleIdx((v) => (v.includes(idx) ? v : [...v, idx]));
        if (idx === REACTION_MSG_INDEX) {
          const v = videoRef.current;
          if (v) {
            const armed = soundArmedRef.current;
            v.muted = !armed;
            setMuted(!armed);
            v.play().catch(() => {
              v.muted = true;
              setMuted(true);
              v.play().catch(() => {});
            });
          }
          if (REACTION_TIMESTAMP == null) triggerBloom();
        }
        continue;
      }
      // delay
      timerStartedAtRef.current = Date.now();
      timerRemainingRef.current = step.ms;
      timerRef.current = setTimeout(runStep, step.ms);
      return;
    }
    // Done
    setPlaying(false);
    setFinished(true);
    setTyping(false);
    const v = videoRef.current;
    if (v && !v.paused) {
      // let video finish naturally; don't force pause
    }
  }, [soundArmedRef, triggerBloom]);

  const startSequence = useCallback(() => {
    clearTimer();
    stepIRef.current = 0;
    setVisibleIdx([]);
    setTyping(false);
    setFinished(false);
    setPlaying(true);
    runStep();
  }, [runStep]);

  const pauseAll = useCallback(() => {
    clearTimer();
    timerRemainingRef.current = Math.max(0, timerRemainingRef.current - (Date.now() - timerStartedAtRef.current));
    videoRef.current?.pause();
    setPlaying(false);
  }, []);

  const resumeAll = useCallback(() => {
    setPlaying(true);
    const v = videoRef.current;
    if (v && v.currentTime > 0 && !v.ended) v.play().catch(() => {});
    if (timerRemainingRef.current > 0) {
      timerStartedAtRef.current = Date.now();
      timerRef.current = setTimeout(runStep, timerRemainingRef.current);
    } else {
      runStep();
    }
  }, [runStep]);

  const replayAll = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0.01;
      } catch {}
      v.pause();
    }
    startSequence();
  }, [startSequence]);

  const togglePlay = () => {
    if (finished) {
      replayAll();
      return;
    }
    if (playing) pauseAll();
    else resumeAll();
  };

  // Start ONCE when scrolled into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (startedOnceRef.current) return;
        startedOnceRef.current = true;
        if (reduce) {
          setVisibleIdx(SCRIPT.map((_, i) => i));
          setFinished(true);
          triggerBloom();
          return;
        }
        startSequence();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, startSequence, triggerBloom]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  // Motion preference
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(m.matches);
    const handler = () => setReduce(m.matches);
    m.addEventListener?.("change", handler);
    return () => m.removeEventListener?.("change", handler);
  }, []);

  // Prime video first frame
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    try {
      v.currentTime = 0.01;
    } catch {}
  }, []);

  // Timestamp-based bloom
  useEffect(() => {
    if (REACTION_TIMESTAMP == null) return;
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.currentTime >= (REACTION_TIMESTAMP as number)) {
        triggerBloom();
        v.removeEventListener("timeupdate", onTime);
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [triggerBloom]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    // Once the user unmutes, treat sound as armed so later autoplay triggers don't remute.
    if (!next) soundArmedRef.current = true;
    if (!next && v.currentTime > 0 && !v.ended) v.play().catch(() => {});
  };

  const lastThemVisible = Math.max(-1, ...visibleIdx.filter((i) => SCRIPT[i].from === "them"));

  return (
    <div ref={sectionRef} className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Video */}
        <Reveal>
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-float bg-black aspect-[4/5]">
            <video
              ref={videoRef}
              src={reactionVideo.url}
              preload="metadata"
              playsInline
              muted
              className="w-full h-full object-cover duotone"
            />
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Volume2 className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </Reveal>

        {/* Chat + floating caption */}
        <Reveal delay={80}>
          <div className="relative">
            <div
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4 md:-top-6 z-10 transition-all duration-[550ms] ease-out ${
                showCaption ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-2"
              }`}
            >
              <div className="rounded-full bg-card/90 backdrop-blur border border-border/60 shadow-soft px-5 py-2 text-sm font-medium">
                It's heating now.
              </div>
            </div>

            <div
              className={`rounded-[2rem] shadow-float overflow-hidden border border-border/40 max-w-md mx-auto transition-[filter] duration-[900ms] ease-out ${
                bloomedLocal ? "" : "duotone"
              }`}
              style={{ backgroundColor: "#ECE5DD" }}
            >
              {/* WhatsApp header */}
              <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#075E54", color: "white" }}>
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white font-semibold">
                  G
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[15px] leading-tight">GeyserBrain</div>
                  <div className="text-[12px] leading-tight text-white/80 h-[16px]">
                    {typing ? "typing…" : "online"}
                  </div>
                </div>
              </div>

              {/* Chat body */}
              <div
                className="px-4 py-5 space-y-1.5 min-h-[440px]"
                style={{
                  backgroundColor: "#ECE5DD",
                  backgroundImage: "radial-gradient(oklch(0 0 0 / 0.04) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              >
                {visibleIdx.map((idx) => {
                  const m = SCRIPT[idx];
                  const isMe = m.from === "me";
                  const read = isMe && idx < lastThemVisible;
                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-[fadeRise_.45s_ease-out_both]`}
                    >
                      <div
                        className={`relative max-w-[78%] px-3 pt-2 pb-[6px] text-[14.5px] leading-snug shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${
                          isMe
                            ? "rounded-2xl rounded-br-[4px] text-neutral-900"
                            : "rounded-2xl rounded-bl-[4px] text-neutral-900"
                        }`}
                        style={{
                          backgroundColor: isMe ? "#DCF8C6" : "#FFFFFF",
                        }}
                      >
                        <span className="pr-14">{m.text}</span>
                        <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[10.5px] text-neutral-500 leading-none">
                          <span>{TIMES[idx]}</span>
                          {isMe && <DoubleCheck read={read} />}
                        </span>
                        {/* Tail */}
                        <span
                          aria-hidden
                          className={`absolute bottom-0 w-2 h-2 ${isMe ? "-right-1" : "-left-1"}`}
                          style={{
                            backgroundColor: isMe ? "#DCF8C6" : "#FFFFFF",
                            clipPath: isMe ? "polygon(0 0, 100% 100%, 0 100%)" : "polygon(100% 0, 100% 100%, 0 100%)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="flex justify-start">
                    <div
                      className="rounded-2xl rounded-bl-[4px] px-4 py-3 flex gap-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_infinite]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_.15s_infinite]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_.3s_infinite]" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Shared play / pause / replay control */}
      <div className="flex justify-center">
        <button
          onClick={togglePlay}
          aria-label={finished ? "Replay demo" : playing ? "Pause demo" : "Play demo"}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-float transition-all"
        >
          {finished ? (
            <>
              <RotateCcw className="w-4 h-4" strokeWidth={1.9} />
              Replay
            </>
          ) : playing ? (
            <>
              <Pause className="w-4 h-4" strokeWidth={1.9} />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" strokeWidth={1.9} />
              Play
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Floating WhatsApp ---------- */

function FloatingWA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a
      href={wa("GEYSER")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-float transition-all duration-500 motion-safe:animate-[breathe_3s_ease-in-out_infinite] ${
        show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
    </a>
  );
}

/* ---------- Green "See it work" reveal button ---------- */

function SeeItWorkButton({ onArm, className = "" }: { onArm: () => void; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [bounced, setBounced] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !bounced) {
          setBounced(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [bounced]);
  return (
    <button
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onArm();
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 motion-safe:animate-[glow_3s_ease-in-out_infinite] ${
        bounced ? "motion-safe:animate-[softBounce_.9s_ease-out_1]" : ""
      } ${className}`}
      style={{ backgroundColor: "#25D366" }}
    >
      See it work
    </button>
  );
}

/* ---------- FAQ ---------- */

type Faq = { q: string; a: string; action?: "waitlist" };

const faqs: Faq[] = [
  {
    q: "How long does installation take?",
    a: "Usually under two hours. A certified electrician handles it — you barely notice it happen.",
  },
  {
    q: "What if my home doesn't qualify?",
    a: "You get a full refund. No questions, no forms.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Month-to-month, no lock-in.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Only you and the people you invite can control your geyser. We never share your usage.",
  },
  {
    q: "What if I rent my home?",
    a: "You'll need your landlord's OK — the install touches your distribution board.",
  },
];

/* ---------- Page ---------- */

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bloomed, setBloomed] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const [chatMode, setChatMode] = useState<"qualify" | "waitlist">("qualify");
  const soundArmedRef = useRef(false);
  const pricing = useCurrency();

  const openQualifyChat = () => {
    setChatMode("qualify");
    setChatActive(true);
    setTimeout(() => {
      document.getElementById("qualify-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const openWaitlistChat = () => {
    setChatMode("waitlist");
    setChatActive(true);
    setTimeout(() => {
      document.getElementById("qualify-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden ${bloomed ? "bloomed" : ""}`}>
      <style>{`
        @keyframes fadeRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dot { 0%, 60%, 100% { opacity: .3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.35), 0 10px 30px -12px rgba(37,211,102,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0), 0 14px 34px -12px rgba(37,211,102,0.65); }
        }
        @keyframes softBounce {
          0% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          70% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      {/* Nav */}
      <header className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-5xl">
        <div className="rounded-full bg-white/70 backdrop-blur-xl border border-border/60 shadow-soft pl-3 pr-3 md:pl-5 md:pr-5 py-2 md:py-3 flex items-center justify-between gap-3">
          <a href="#" className="flex items-center gap-2 font-medium min-w-0">
            <img src={logoAsset} alt="GeyserBrain" className="h-7 md:h-8 w-auto shrink-0" />
            <span className="hidden sm:inline truncate">GeyserBrain</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#benefits" className="hover:text-foreground transition">
              Benefits
            </a>
            <a href="#how" className="hover:text-foreground transition">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition">
              FAQ
            </a>
          </nav>
          <a
            href={wa("GEYSER")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 md:px-5 py-2 text-xs font-medium hover:opacity-90 transition shrink-0"
          >
            Message us
          </a>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="A calm, softly lit home interior"
          className="absolute inset-0 w-full h-full object-cover duotone"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent md:from-black/60 md:via-black/25" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex items-end md:items-center">
          <div className="pb-20 md:pb-0 max-w-2xl text-white space-y-5 md:space-y-6">
            <h1 className="text-[2.75rem] leading-[1] sm:text-6xl md:text-7xl tracking-tight">
              Smart home.
              <br />
              <span className="italic text-white/80">Soft life.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-lg leading-relaxed">
              Talk to your home on WhatsApp. Calm, effortless, always in your pocket.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
              <button
                type="button"
                onClick={openQualifyChat}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-7 py-4 text-sm font-medium shadow-soft hover:-translate-y-0.5 transition-all"
              >
                Check if my home qualifies
              </button>
              <SeeItWorkButton
                onArm={() => {
                  soundArmedRef.current = true;
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Demo */}
      <section id="demo" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <Reveal className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl leading-tight">A conversation, not a control panel.</h2>
          </Reveal>
          <DemoBlock onBloom={() => setBloomed(true)} soundArmedRef={soundArmedRef} />
        </div>
      </section>

      {/* Qualify chat drop-in */}
      {chatActive && (
        <section id="qualifies" className="scroll-mt-24 px-6 pb-12">
          <div id="qualify-chat" className="max-w-xl mx-auto scroll-mt-24">
            <QualifyChat active={chatActive} mode={chatMode} />
          </div>
        </section>
      )}

      {/* 3. Benefits */}
      <section id="benefits" className="py-24 md:py-32 px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-28">
          {[
            {
              n: "01",
              title: "Ask, and it's done.",
              desc: "Switch it on, set a time, check if it's running — in your own words.",
            },
            {
              n: "02",
              title: "See what you're spending.",
              desc: "A quiet weekly rand report shows up in the chat. No app to open.",
            },
            {
              n: "03",
              title: "The whole home can use it.",
              desc: "Add anyone in your household. No logins, no lost passwords.",
            },
          ].map((b, i) => (
            <Reveal key={b.n} delay={i * 80}>
              <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-16 items-baseline">
                <div className="text-sm text-muted-foreground tracking-widest">{b.n}</div>
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-5xl leading-tight">{b.title}</h3>
                  <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={240}>
            <p className="text-sm text-muted-foreground italic max-w-xl">
              Is this for you? If you have a geyser and Wi-Fi, yes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4">How it works</div>
            <h2 className="text-4xl md:text-5xl">Three quiet steps.</h2>
          </Reveal>
          <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-border" />
            {[
              { n: "01", title: "We check your home" },
              { n: "02", title: "An electrician fits the controller" },
              { n: "03", title: "You start chatting on WhatsApp" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative text-center md:text-left">
                  <div className="relative z-10 w-16 h-16 mx-auto md:mx-0 rounded-full bg-background border border-border flex items-center justify-center text-sm tracking-widest text-muted-foreground mb-6">
                    {s.n}
                  </div>
                  <h3 className="text-2xl leading-snug">{s.title}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section id="pricing" className="py-24 md:py-32 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.3em] text-primary-foreground/60">First 10 homes only</div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <div className="text-6xl md:text-8xl tracking-tight leading-none">{pricing.install}</div>
              <div className="text-primary-foreground/70 mt-3">
                installed{pricing.currency === "ZAR" ? " (incl. VAT)" : ""}
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="max-w-md mx-auto pt-6 border-t border-primary-foreground/15">
              <ul className="text-left space-y-3 text-sm text-primary-foreground/85">
                {[
                  "Smart geyser controller included",
                  "Certified electrician installation",
                  "GeyserBrain setup on WhatsApp",
                  "First 3 months included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-primary-foreground/60 mt-6">
                Then {pricing.monthly}/month. Cancel anytime.
                {pricing.approx ? " Prices outside South Africa are estimates." : ""}
              </p>
              <p className="text-xs text-primary-foreground/50 mt-3">
                You'll need a geyser and Wi-Fi at home.
              </p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <button
              type="button"
              onClick={openQualifyChat}
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-medium bg-white text-black shadow-float hover:-translate-y-0.5 transition-all"
            >
              Check if my home qualifies
            </button>
          </Reveal>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4">FAQ</div>
            <h2 className="text-4xl md:text-5xl">Quiet answers.</h2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-3xl border border-border/60 bg-card transition-all duration-[350ms] ${
                    open ? "shadow-soft" : ""
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between text-left px-8 py-6"
                    aria-expanded={open}
                  >
                    <span className="text-lg font-medium pr-6">{f.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-[350ms] ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-[550ms] ease-out ${
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-8 pb-6 text-muted-foreground leading-relaxed space-y-3">
                        <p>{f.a}</p>
                        {f.action === "waitlist" && (
                          <button
                            type="button"
                            onClick={openWaitlistChat}
                            className="text-sm text-foreground underline hover:opacity-70 transition"
                          >
                            Join the waitlist →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Final */}
      <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={homeImg}
          alt="A modern home in soft light"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover duotone"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="text-center text-white space-y-6 md:space-y-8 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl md:text-7xl tracking-tight leading-[1.05]">
              Switch off the work.
              <br />
              <span className="italic text-white/85">Switch on soft life.</span>
            </h2>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={openQualifyChat}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-7 py-4 text-sm font-medium shadow-soft hover:-translate-y-0.5 transition-all"
              >
                Check if my home qualifies
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoAsset} alt="GeyserBrain" className="h-7 w-auto" />
            <span className="text-foreground font-medium">GeyserBrain</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground transition">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition">
              Terms of Service
            </a>
          </div>
          <p>© {new Date().getFullYear()} GeyserBrain. Smart home. Soft life.</p>
        </div>
      </footer>

      <FloatingWA />
    </div>
  );
}

