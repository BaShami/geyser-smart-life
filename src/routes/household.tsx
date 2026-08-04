import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, ArrowRight, Menu, X } from "lucide-react";
import logoAsset from "@/assets/geyserbrain-logo.png";
import { track, getSessionId, ensureUtmCapture } from "@/lib/session";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#examples", label: "Examples" },
  { href: "#privacy", label: "Privacy" },
  { href: "/", label: "Existing geyser control" },
];

export const Route = createFileRoute("/household")({
  component: HouseholdPilot,
  head: () => ({
    meta: [
      { title: "GeyserBrain for Households — Private WhatsApp pilot" },
      {
        name: "description",
        content:
          "Send one WhatsApp instruction for someone in your household. GeyserBrain contacts them, follows up once and only brings you back in when it is still unresolved. Private pilot.",
      },
      { property: "og:title", content: "GeyserBrain for Households — Private WhatsApp pilot" },
      {
        property: "og:description",
        content:
          "Hand over a household responsibility and stop carrying it in your head. Join the private pilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
  }),
});

/* ---------- Reveal ---------- */
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
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
      className={`transition-all duration-500 ease-out motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Generic chat demo ---------- */
type Bubble = { who: "you" | "gb" | "member"; label: string; text: string; chips?: string[] };

const CHAT: Bubble[] = [
  {
    who: "you",
    label: "You",
    text: "Tell Tino to pack his sports clothes before 8 PM. Remind him once and tell me only if he does not respond.",
  },
  {
    who: "gb",
    label: "GeyserBrain",
    text: "I’ll message Tino at 7 PM and follow up once. I’ll bring you back in only if it is still unresolved.",
  },
  {
    who: "gb",
    label: "GeyserBrain → Tino",
    text: "Your dad asked you to pack your sports clothes before 8 PM.",
    chips: ["Done", "Later", "I can’t", "I need help"],
  },
  { who: "member", label: "Tino", text: "Done" },
  {
    who: "gb",
    label: "GeyserBrain",
    text: "Tino marked it as done. No action is needed from you.",
  },
];

function ChatDemo({ onView }: { onView: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !fired.current) {
          fired.current = true;
          onView();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onView]);

  return (
    <div ref={ref} className="rounded-3xl border border-border/70 bg-card p-3 sm:p-5 shadow-soft">
      <div className="space-y-3">
        {CHAT.map((b, i) => {
          const mine = b.who === "you";
          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`text-[10px] uppercase tracking-wider mb-1 text-muted-foreground ${
                    mine ? "text-right" : ""
                  }`}
                >
                  {b.label}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {b.text}
                  {b.chips && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.chips.map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Completion is confirmed by the household member; GeyserBrain does not physically verify that the
        action happened.
      </p>
    </div>
  );
}

/* ---------- Pilot form ---------- */
const FOLLOW_UP = ["Partner", "Child", "Relative", "Caregiver", "Other household member"];
const FREQUENCY = ["Daily", "Several times a week", "Weekly", "Occasionally"];
const INVITE = ["Yes", "Maybe", "No"];

function PilotForm() {
  const [form, setForm] = useState({
    full_name: "",
    whatsapp_number: "",
    country: "",
    runs_household: "",
    household_whatsapp_users: "",
    follow_up_with: "",
    repeated_responsibility: "",
    frequency: "",
    would_invite: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const started = useRef(false);

  const set = (k: keyof typeof form) => (v: string) => {
    if (!started.current) {
      started.current = true;
      track({ event_name: "household_form_started", funnel_step: "pilot_form" });
    }
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    const { first, latest } = ensureUtmCapture();
    try {
      const res = await fetch("/api/household-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          session_id: getSessionId(),
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          utm: latest ?? first ?? null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      track({
        event_name: "household_form_completed",
        funnel_step: "pilot_form",
        country: form.country || null,
        metadata: {
          follow_up_with: form.follow_up_with,
          frequency: form.frequency,
          would_invite: form.would_invite,
        },
      });
      track({
        event_name: "household_responsibility_category",
        funnel_step: "pilot_form",
        metadata: { follow_up_with: form.follow_up_with },
      });
      track({
        event_name: "household_frequency_reported",
        funnel_step: "pilot_form",
        metadata: { frequency: form.frequency },
      });
      track({
        event_name: "household_invite_willingness",
        funnel_step: "pilot_form",
        metadata: { would_invite: form.would_invite },
      });
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 w-11 h-11 rounded-full bg-muted flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <p className="text-base sm:text-lg">
          Thank you. We will contact selected pilot households through WhatsApp.
        </p>
      </div>
    );
  }

  const label = "block text-sm mb-2 text-foreground";
  const field =
    "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-soft">
      <div>
        <label className={label} htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          required
          className={field}
          value={form.full_name}
          onChange={(e) => set("full_name")(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <label className={label} htmlFor="wa">WhatsApp number</label>
        <input
          id="wa"
          required
          inputMode="tel"
          className={field}
          value={form.whatsapp_number}
          onChange={(e) => set("whatsapp_number")(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <label className={label} htmlFor="country">Country</label>
        <input
          id="country"
          className={field}
          value={form.country}
          onChange={(e) => set("country")(e.target.value)}
          autoComplete="country-name"
        />
      </div>

      <div>
        <span className={label}>Are you responsible for running most of your household?</span>
        <div className="flex flex-wrap gap-2">
          {["Yes", "Shared", "No"].map((o) => (
            <Chip key={o} active={form.runs_household === o} onClick={() => set("runs_household")(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="hh">How many people in your household actively use WhatsApp?</label>
        <input
          id="hh"
          inputMode="numeric"
          className={field}
          value={form.household_whatsapp_users}
          onChange={(e) => set("household_whatsapp_users")(e.target.value)}
        />
      </div>

      <div>
        <span className={label}>Who do you most often need to follow up with?</span>
        <div className="flex flex-wrap gap-2">
          {FOLLOW_UP.map((o) => (
            <Chip key={o} active={form.follow_up_with === o} onClick={() => set("follow_up_with")(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="resp">
          What responsibility do you most often have to repeat or chase?
        </label>
        <textarea
          id="resp"
          rows={3}
          className={field}
          value={form.repeated_responsibility}
          onChange={(e) => set("repeated_responsibility")(e.target.value)}
        />
      </div>

      <div>
        <span className={label}>How often does this happen?</span>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY.map((o) => (
            <Chip key={o} active={form.frequency === o} onClick={() => set("frequency")(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Would you invite one household member to test this with you?</span>
        <div className="flex flex-wrap gap-2">
          {INVITE.map((o) => (
            <Chip key={o} active={form.would_invite === o} onClick={() => set("would_invite")(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-primary text-primary-foreground px-6 py-4 text-base font-medium disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Apply for the private pilot"}
      </button>
    </form>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Page ---------- */
function HouseholdPilot() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    ensureUtmCapture();
    getSessionId();
    track({ event_name: "page_view", funnel_step: "household_pilot" });
  }, []);

  const joinClick = (where: string) =>
    track({ event_name: "household_join_cta_clicked", funnel_step: where });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-5xl">
        <div className="rounded-full bg-white/80 backdrop-blur-xl border border-white/80 shadow-soft pl-3 pr-3 md:pl-5 md:pr-5 py-2 md:py-3 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 font-medium min-w-0 text-neutral-900">
            <img src={logoAsset} alt="GeyserBrain" className="h-7 md:h-8 w-auto shrink-0" />
            <span className="hidden sm:inline truncate">GeyserBrain</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() =>
                  l.href === "/" && track({ event_name: "geyser_product_clicked", funnel_step: "nav" })
                }
                className="hover:text-neutral-950"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#pilot"
              onClick={() => joinClick("nav")}
              className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium"
            >
              Join the pilot
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/80 bg-white/80 text-neutral-900"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden mt-3 flex flex-col items-end gap-2">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => {
                  setMenuOpen(false);
                  if (l.href === "/") track({ event_name: "geyser_product_clicked", funnel_step: "nav" });
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold text-right text-neutral-900 bg-white/25 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* 1. Hero */}
      <section className="px-6 pt-28 pb-14 sm:pt-36 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Private household pilot
          </div>
          <h1 className="mt-5 text-[2.1rem] leading-[1.1] sm:text-5xl tracking-tight">
            Tell your home once.
            <br />
            <span className="italic text-muted-foreground">It follows through.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Send a WhatsApp instruction for someone in your household. GeyserBrain contacts them, follows
            up when necessary and alerts you only when something still needs your attention.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row sm:justify-center gap-3">
            <a
              href="#pilot"
              onClick={() => joinClick("hero")}
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-4 text-base font-medium"
            >
              Join the pilot
            </a>
            <a
              href="#example"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-4 text-base font-medium"
            >
              See an example
            </a>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">No smart-home hardware required.</p>
        </div>
      </section>

      {/* 2. Core problem */}
      <section className="px-6 py-12 sm:py-20 border-t border-border/60">
        <Reveal className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl leading-tight tracking-tight">
            Running a household should not depend on one person remembering everything.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Important household responsibilities often live in one person’s head. That person has to
            remember the right time, send the message, check whether it was seen and chase again when
            nobody responds. GeyserBrain is being built to carry that follow-through.
          </p>
        </Reveal>
      </section>

      {/* 3. Demonstration */}
      <section id="example" className="px-6 py-12 sm:py-20 border-t border-border/60 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <Reveal className="mb-6">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">Example</div>
            <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight">
              One instruction, handled end to end.
            </h2>
          </Reveal>
          <Reveal>
            <ChatDemo
              onView={() => track({ event_name: "household_example_viewed", funnel_step: "example" })}
            />
          </Reveal>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how" className="px-6 py-12 sm:py-20 border-t border-border/60 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight mb-8">How it works</h2>
          <ol className="space-y-5">
            {[
              "Tell GeyserBrain what needs to happen.",
              "It contacts the relevant invited household member.",
              "It records the response and follows up once if necessary.",
              "It brings you back in only when the responsibility remains unresolved.",
            ].map((s, i) => (
              <Reveal key={i}>
                <li className="flex gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <span className="text-base leading-relaxed pt-1">{s}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Example responsibilities */}
      <section id="examples" className="px-6 py-12 sm:py-20 border-t border-border/60 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight">
            What the private pilot is testing
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            These three kinds of responsibility are what we are testing right now — nothing more.
          </p>
          <div className="mt-7 space-y-4">
            {[
              {
                t: "Parenting and school preparation",
                q: "“Remind Tino to prepare his school bag before 7 PM.”",
              },
              {
                t: "Family logistics",
                q: "“Ask Sarah whether she can collect the children tomorrow.”",
              },
              {
                t: "Household responsibilities",
                q: "“Tell David to put the bins outside and alert me only if he does not respond.”",
              },
            ].map((e) => (
              <Reveal key={e.t}>
                <div className="rounded-2xl border border-border/70 bg-card p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{e.t}</div>
                  <p className="mt-2 text-base sm:text-lg leading-relaxed">{e.q}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. What this is not */}
      <section className="px-6 py-12 sm:py-20 border-t border-border/60">
        <Reveal className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight">
            This is not another family group or a generic reminder app.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            A reminder app reminds you to chase someone. GeyserBrain is being tested as the system that
            contacts the responsible household member and manages the follow-up.
          </p>
        </Reveal>
      </section>

      {/* 7. Privacy */}
      <section id="privacy" className="px-6 py-12 sm:py-20 border-t border-border/60 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            The household remains in control.
          </h2>
          <ul className="mt-7 space-y-3">
            {[
              "Only invited household members participate.",
              "People can say no, request help or opt out.",
              "The assigning person can cancel a responsibility.",
              "The system keeps a clear activity history.",
              "It does not silently import personal contacts.",
              "It does not claim to verify physical completion.",
              "It is not intended for emergencies.",
            ].map((p) => (
              <li key={p} className="flex gap-3 text-base leading-relaxed">
                <Check className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. Pilot signup */}
      <section id="pilot" className="px-6 py-12 sm:py-20 border-t border-border/60 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight">
            Help test whether this actually reduces household follow-up.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Currently being tested with a small number of households. Early access only.
          </p>
          <div className="mt-7">
            <PilotForm />
          </div>
        </div>
      </section>

      {/* 9. Existing geyser product */}
      <section className="px-6 py-12 sm:py-16 border-t border-border/60">
        <div className="max-w-3xl mx-auto rounded-3xl border border-border/70 bg-muted/50 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl">Already looking for smart geyser control?</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            GeyserBrain’s existing geyser-control service remains available separately.
          </p>
          <a
            href="/"
            onClick={() => track({ event_name: "geyser_product_clicked", funnel_step: "footer" })}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-background px-5 py-3 text-sm font-medium"
          >
            Explore geyser control <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-muted-foreground">
        GeyserBrain for Households — private pilot. Temporary product label.
      </footer>
    </div>
  );
}
