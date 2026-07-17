import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import electricianImg from "@/assets/electrician.jpg";
import homeImg from "@/assets/home.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const WA_NUMBER = "27744224646";
const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const CITIES = "Pretoria & Johannesburg";
const SPOTS_TAKEN = 10;

/* ---------- primitives ---------- */

function PillLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "light" | "ghost";
  className?: string;
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
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </a>
  );
}

/* ---------- Reveal wrapper: fade + rise on scroll ---------- */

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

/* ---------- Animated WhatsApp demo ---------- */

type Msg = { from: "me" | "them"; text: string };
const SCRIPT: Msg[] = [
  { from: "me", text: "Heat the water for 45 minutes." },
  { from: "them", text: "Done. I'll switch it off automatically when the time is up." },
  { from: "me", text: "And have it ready tomorrow at 6am." },
  { from: "them", text: "Your weekday morning schedule is set." },
];

function WhatsAppDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStarted(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(SCRIPT);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = async () => {
      for (let i = 0; i < SCRIPT.length; i++) {
        const msg = SCRIPT[i];
        if (msg.from === "them") {
          await new Promise<void>((r) => {
            const t = setTimeout(() => {
              if (cancelled) return;
              setTyping(true);
              r();
            }, 700);
            timers.push(t);
          });
          await new Promise<void>((r) => {
            const t = setTimeout(r, 1100);
            timers.push(t);
          });
          if (cancelled) return;
          setTyping(false);
        }
        await new Promise<void>((r) => {
          const t = setTimeout(() => {
            if (cancelled) return;
            setVisible((v) => [...v, msg]);
            r();
          }, 350);
          timers.push(t);
        });
        await new Promise<void>((r) => {
          const t = setTimeout(r, 900);
          timers.push(t);
        });
      }
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [started]);

  return (
    <div
      ref={containerRef}
      className="rounded-[2.5rem] bg-white shadow-float overflow-hidden border border-border/40 max-w-md mx-auto"
    >
      <div className="bg-secondary/60 px-6 py-4 flex items-center gap-3 border-b border-border/40">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-sm">GeyserBrain</div>
          <div className="text-xs text-muted-foreground">online</div>
        </div>
      </div>
      <div className="p-6 space-y-3 bg-[oklch(0.98_0_0)] min-h-[360px]">
        {visible.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} animate-[fadeRise_.55s_ease-out_both]`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm ${
                m.from === "me"
                  ? "bg-primary text-primary-foreground rounded-br-lg"
                  : "bg-white text-foreground rounded-bl-lg shadow-sm border border-border/40"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-3xl rounded-bl-lg shadow-sm border border-border/40 px-5 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[dot_1.2s_ease-in-out_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[dot_1.2s_ease-in-out_.15s_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[dot_1.2s_ease-in-out_.3s_infinite]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Floating WhatsApp button (after hero) ---------- */

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

/* ---------- FAQ ---------- */

const faqs = [
  {
    q: "Do I need to download an app?",
    a: "No. GeyserBrain works entirely through WhatsApp — the app you already have. Save the number and message it like you'd message anyone else.",
  },
  {
    q: "Will it work with my existing geyser?",
    a: "Most standard electric geysers are supported. We check your home before installation to confirm compatibility.",
  },
  {
    q: "How long does installation take?",
    a: "A certified electrician typically completes installation in under two hours, with minimal disruption to your home.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Only you and the people you invite can control your geyser. We never share your usage data.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. The monthly service is month-to-month with no lock-in after the first three months included in your install.",
  },
  {
    q: "What if I rent my home?",
    a: "You'll need permission from your landlord or body corporate, since installation involves your home's distribution board.",
  },
  {
    q: "Do I need to already own a smart switch?",
    a: "No — the smart controller is included in your once-off price and fitted by our electrician.",
  },
  {
    q: "What happens during load-shedding?",
    a: "GeyserBrain doesn't yet sync with load-shedding schedules — that's on our roadmap. Manual control and your schedules resume automatically once power returns.",
  },
  {
    q: "What if my home doesn't qualify?",
    a: "You get a full refund. If we can't install for any technical reason, we return your payment in full — no questions asked.",
  },
];

/* ---------- Page ---------- */

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Local keyframes */}
      <style>{`
        @keyframes fadeRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dot { 0%, 60%, 100% { opacity: .3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      `}</style>

      {/* Nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-5xl">
        <div className="rounded-full bg-white/70 backdrop-blur-xl border border-border/60 shadow-soft px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-7 h-7 rounded-full bg-primary" />
            <span>GeyserBrain</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#benefits" className="hover:text-foreground transition">Benefits</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <a
            href={wa("GEYSER")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium hover:opacity-90 transition"
          >
            Message us
          </a>
        </div>
      </header>

      {/* 1. Hero — full-bleed */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="A calm, softly lit home interior"
          className="absolute inset-0 w-full h-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex items-end md:items-center">
          <div className="pb-16 md:pb-0 max-w-2xl text-white space-y-6">
            <h1 className="text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Smart home.<br />
              <span className="italic text-white/80">Soft life.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-lg leading-relaxed">
              Your geyser, one WhatsApp away. Check it, control it, schedule it, and understand what it costs.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <PillLink
                href={wa("Hi, I'd like to check if my home qualifies for GeyserBrain")}
                variant="light"
              >
                Check if my home qualifies
              </PillLink>
              <a
                href="#how"
                className="text-sm text-white/80 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition self-start sm:self-auto"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Philosophy */}
      <section className="py-32 md:py-40 px-6">
        <Reveal className="max-w-3xl mx-auto text-center space-y-8">
          <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
            The quiet smart home
          </div>
          <h2 className="text-4xl md:text-6xl leading-[1.05]">
            Your home shouldn't feel mechanical.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            No control panels to study. No complicated apps to manage. Just tell your home what you need.
          </p>
        </Reveal>
      </section>

      {/* 3. Is this for you? */}
      <section className="py-24 md:py-32 px-6 bg-secondary/40">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4">
              Is this for you?
            </div>
            <h2 className="text-3xl md:text-5xl mb-12">A short list. Nothing hidden.</h2>
          </Reveal>
          <ul className="space-y-6">
            {[
              "You own a standard electric geyser (not gas, not a heat pump).",
              "You — or your landlord, with permission — can access your home's distribution board.",
              "Wi-Fi reaches the geyser's location (2.4GHz).",
              `You're within our current install area: ${CITIES}.`,
            ].map((line, i) => (
              <Reveal key={i} delay={i * 60}>
                <li className="flex items-start gap-4 text-lg">
                  <div className="mt-1.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="leading-relaxed">{line}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={200}>
            <p className="text-sm text-muted-foreground italic mt-10 pl-10">
              Not sure? Message us and we'll check together — no obligation.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4. WhatsApp demonstration */}
      <section className="py-28 md:py-36 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="rounded-[2.5rem] overflow-hidden shadow-float">
              <img
                src={homeImg}
                alt="A calm morning routine at home"
                loading="lazy"
                className="w-full h-full object-cover aspect-[4/5] grayscale"
              />
            </div>
          </Reveal>
          <div className="space-y-10">
            <Reveal>
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl leading-tight">
                  A conversation, not a control panel.
                </h2>
                <p className="text-lg text-muted-foreground max-w-md">
                  Control your geyser the same way you'd ask someone at home.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <WhatsAppDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. Benefits — three grouped statements */}
      <section id="benefits" className="py-28 md:py-36 px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto space-y-24 md:space-y-32">
          {[
            {
              n: "01",
              title: "Control it, however you like.",
              desc: "Check status, switch it on or off, or set a schedule in plain language.",
            },
            {
              n: "02",
              title: "Understand what it costs.",
              desc: "Monitor supported energy usage and get useful alerts when something's off.",
            },
            {
              n: "03",
              title: "Share it with your household.",
              desc: "Give family members their own access — no shared logins, no confusion.",
            },
          ].map((b, i) => (
            <Reveal key={b.n} delay={i * 80}>
              <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-16 items-baseline">
                <div className="text-sm text-muted-foreground tracking-widest">{b.n}</div>
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-5xl leading-tight">{b.title}</h3>
                  <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. How it works */}
      <section id="how" className="py-28 md:py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-20">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4">
              How it works
            </div>
            <h2 className="text-4xl md:text-5xl">Three quiet steps.</h2>
          </Reveal>
          <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-border" />
            {[
              {
                n: "01",
                title: "We check your home",
                desc: "A quick compatibility check to confirm your geyser is supported.",
              },
              {
                n: "02",
                title: "An electrician installs the controller",
                desc: "Certified, tidy, and typically done in under two hours.",
              },
              {
                n: "03",
                title: "GeyserBrain activates on WhatsApp",
                desc: "Save the number, say hello, and you're in control.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative text-center md:text-left">
                  <div className="relative z-10 w-16 h-16 mx-auto md:mx-0 rounded-full bg-background border border-border flex items-center justify-center text-sm tracking-widest text-muted-foreground mb-6">
                    {s.n}
                  </div>
                  <h3 className="text-2xl mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <p className="text-center text-sm text-muted-foreground mt-16">
              Currently rolling out in {CITIES}. More areas coming as we grow.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Trust */}
      <section className="py-28 md:py-36 px-6 bg-secondary/40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <div className="rounded-[2.5rem] overflow-hidden shadow-soft">
              <img
                src={electricianImg}
                alt="Certified electrician beside a tidy distribution board"
                loading="lazy"
                className="w-full h-full object-cover aspect-[4/5] grayscale transition-transform duration-[1200ms] ease-out hover:scale-[1.03]"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl leading-tight">
                Installed properly.<br />
                <span className="italic text-muted-foreground">Designed to disappear</span> into your home.
              </h2>
              <ul className="space-y-4 text-lg">
                {[
                  "Certified installation",
                  "Most standard electric geysers supported",
                  "Typically installed within two hours",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-1 flex-shrink-0" strokeWidth={2} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. Pricing — dark, full-width */}
      <section id="pricing" className="py-28 md:py-36 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <Reveal>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-primary-foreground/60">
                Founding 10 homes
              </div>
              <div className="text-sm text-primary-foreground/70">
                {SPOTS_TAKEN} of 10 spots taken
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <div className="text-6xl md:text-8xl tracking-tight leading-none">R1,999</div>
              <div className="text-primary-foreground/70 mt-3">installed (incl. VAT)</div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="max-w-md mx-auto pt-6 border-t border-primary-foreground/15">
              <ul className="text-left space-y-3 text-sm text-primary-foreground/85">
                {[
                  "Smart geyser controller included",
                  "Standard electrician installation",
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
                Thereafter R99/month. Cancel anytime.
              </p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <PillLink href={wa("GEYSER")} variant="light">
              Join the Founding 10
            </PillLink>
          </Reveal>
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="py-28 md:py-36 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4">
              FAQ
            </div>
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
                      <p className="px-8 pb-6 text-muted-foreground leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. Final — full-bleed */}
      <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        <img
          src={homeImg}
          alt="A modern home in soft light"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="text-center text-white space-y-8 max-w-2xl">
            <h2 className="text-5xl md:text-7xl tracking-tight leading-[1.02]">
              Switch off the work.<br />
              <span className="italic text-white/85">Switch on soft life.</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md mx-auto">
              Your home handles the routine. You enjoy the comfort.
            </p>
            <div className="pt-2 flex justify-center">
              <PillLink href={wa("GEYSER")} variant="light">
                Check if my home qualifies
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="py-12 px-6 border-t border-border/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary" />
            <span className="text-foreground font-medium">GeyserBrain</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground transition">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition">Terms of Service</a>
          </div>
          <p>© {new Date().getFullYear()} GeyserBrain. Smart home. Soft life.</p>
        </div>
      </footer>

      <FloatingWA />
    </div>
  );
}
