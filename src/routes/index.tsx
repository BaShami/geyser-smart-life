import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, MessageCircle, Home, Wrench, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import electricianImg from "@/assets/electrician.jpg";
import customerImg from "@/assets/customer.jpg";
import homeImg from "@/assets/home.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function PillButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const base = "inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]";
  const styles = variant === "primary"
    ? "bg-primary text-primary-foreground shadow-soft hover:shadow-float"
    : "bg-secondary text-foreground hover:bg-accent";
  return <button className={`${base} ${styles}`}>{children}</button>;
}

function WhatsAppMock({ messages }: { messages: { from: "me" | "them"; text: string }[] }) {
  return (
    <div className="rounded-[2.5rem] bg-white shadow-float overflow-hidden border border-border/40">
      <div className="bg-secondary/60 px-6 py-4 flex items-center gap-3 border-b border-border/40">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-sm">GeyserBrain</div>
          <div className="text-xs text-muted-foreground">online</div>
        </div>
      </div>
      <div className="p-6 space-y-3 bg-[oklch(0.98_0_0)] min-h-[280px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm ${
              m.from === "me"
                ? "bg-primary text-primary-foreground rounded-br-lg"
                : "bg-white text-foreground rounded-bl-lg shadow-sm border border-border/40"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const faqs = [
  { q: "Do I need to download an app?", a: "No. GeyserBrain works entirely through WhatsApp — the app you already have. Just message the number and ask." },
  { q: "Will it work with my existing geyser?", a: "Most standard electric geysers are supported. We'll check your home before installation to make sure everything is compatible." },
  { q: "How long does installation take?", a: "A certified electrician typically completes installation in under two hours, with minimal disruption to your home." },
  { q: "Is my data private?", a: "Yes. Only you and the people you invite can control your geyser. We never share your usage data." },
  { q: "Can I cancel anytime?", a: "Absolutely. The monthly service is month-to-month with no lock-in contracts after the first three months included." },
];

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl">
        <div className="rounded-full bg-white/70 backdrop-blur-xl border border-border/60 shadow-soft px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-7 h-7 rounded-full bg-primary" />
            <span>GeyserBrain</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <a href="#pricing" className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium hover:opacity-90 transition">
            Reply GEYSER
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" />
              Smart home, without the fuss
            </div>
            <h1 className="text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Your geyser.<br />
              <span className="italic text-muted-foreground">One WhatsApp</span> away.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Smart home. Soft life. Check it, control it, schedule it, and understand what it costs.
            </p>
            <div className="flex flex-wrap gap-4">
              <PillButton>Check if my home qualifies</PillButton>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-tr from-secondary to-transparent rounded-[4rem] blur-3xl opacity-70" />
            <div className="relative rounded-[3rem] overflow-hidden shadow-float">
              <img
                src={heroImg}
                alt="Homeowner relaxing on a sofa checking her geyser on WhatsApp"
                width={1600}
                height={1408}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 md:-left-10 rounded-3xl bg-white shadow-float px-6 py-4 flex items-center gap-3 border border-border/40 max-w-xs">
              <div className="w-9 h-9 rounded-full bg-[oklch(0.955_0_0)] flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">You</div>
                <div className="text-sm font-medium">Is my geyser on?</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstration */}
      <section className="py-24 px-6 bg-secondary/40">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-4xl md:text-5xl">A conversation, not a control panel.</h2>
          <div className="max-w-md mx-auto">
            <WhatsAppMock
              messages={[
                { from: "me", text: "Switch off my geyser in 30 minutes." },
                { from: "them", text: "Done." },
                { from: "me", text: "Thanks 🙏" },
              ]}
            />
          </div>
          <p className="text-lg text-muted-foreground italic">No complicated apps. Just ask.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">What you can do</div>
            <h2 className="text-4xl md:text-5xl">Everything you need. Nothing you don't.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              "Check geyser status",
              "Switch it on / off",
              "Create schedules naturally",
              "Monitor supported energy usage",
              "Receive useful alerts",
              "Share access with your family",
            ].map((feat) => (
              <div key={feat} className="rounded-3xl bg-card border border-border/60 p-8 shadow-soft hover:shadow-float transition-all duration-500 hover:-translate-y-1">
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-6">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <p className="text-lg font-medium">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6 bg-secondary/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">How it works</div>
            <h2 className="text-4xl md:text-5xl">Three quiet steps.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { icon: Home, n: "01", title: "We check your home", desc: "A quick compatibility check to confirm your geyser is supported." },
              { icon: Wrench, n: "02", title: "An electrician installs the controller", desc: "Certified, tidy, and typically done in under two hours." },
              { icon: MessageCircle, n: "03", title: "GeyserBrain activates on WhatsApp", desc: "Save the number, say hello, and you're in control." },
            ].map(({ icon: Icon, n, title, desc }) => (
              <div key={n} className="rounded-[2.5rem] bg-card p-10 shadow-soft border border-border/40">
                <div className="text-xs text-muted-foreground mb-6">{n}</div>
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-lg mx-auto">
          <div className="rounded-[3rem] bg-card border border-border/60 shadow-float p-10 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-transparent pointer-events-none" />
            <div className="relative space-y-8">
              <div className="inline-flex rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs tracking-widest uppercase">
                Founding 10
              </div>
              <div>
                <div className="text-6xl md:text-7xl tracking-tight">R1,999</div>
                <div className="text-muted-foreground mt-2">installed</div>
              </div>
              <div className="h-px bg-border" />
              <ul className="text-left space-y-3 text-sm">
                {[
                  "Smart controller included",
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
              <p className="text-xs text-muted-foreground">Thereafter R99/month. Cancel anytime.</p>
              <PillButton>Reply GEYSER</PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-28 px-6 bg-secondary/40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-[2.5rem] overflow-hidden shadow-soft relative group">
            <img
              src={electricianImg}
              alt="Certified electrician beside a tidy distribution board"
              loading="lazy"
              width={1408}
              height={1408}
              className="w-full h-full object-cover aspect-[4/5] group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-2xl">Professionally installed.</p>
            </div>
          </div>
          <div className="rounded-[2.5rem] bg-card border border-border/60 shadow-soft p-10 md:p-12 flex flex-col justify-between">
            <div>
              <div className="text-6xl font-display text-muted-foreground/40 leading-none mb-6">"</div>
              <blockquote className="text-3xl md:text-4xl leading-tight">
                I like that I can just ask on WhatsApp.
              </blockquote>
            </div>
            <div className="flex items-center gap-4 mt-10">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <img src={customerImg} alt="Customer" loading="lazy" width={1200} height={1200} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-medium">Naledi M.</div>
                <div className="text-sm text-muted-foreground">Homeowner, Johannesburg</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">FAQ</div>
            <h2 className="text-4xl md:text-5xl">Quiet answers.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-3xl border border-border/60 bg-card transition-all duration-500 ${
                    open ? "shadow-soft" : ""
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between text-left px-8 py-6"
                  >
                    <span className="text-lg font-medium pr-6">{f.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-out ${
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

      {/* Final CTA */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto rounded-[3rem] overflow-hidden shadow-float relative">
          <img
            src={homeImg}
            alt="Modern home at golden hour"
            loading="lazy"
            width={1408}
            height={1008}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          <div className="relative text-center py-32 px-6 text-white space-y-8">
            <h2 className="text-5xl md:text-7xl tracking-tight">Ready for soft life?</h2>
            <p className="text-lg text-white/80 max-w-md mx-auto">
              Message GEYSER and we'll take it from there.
            </p>
            <div className="pt-4">
              <button className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-8 py-4 text-sm font-medium shadow-float hover:scale-[1.02] transition">
                Reply GEYSER
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary" />
            <span className="text-foreground font-medium">GeyserBrain</span>
          </div>
          <p>© {new Date().getFullYear()} GeyserBrain. Smart home. Soft life.</p>
        </div>
      </footer>
    </div>
  );
}
