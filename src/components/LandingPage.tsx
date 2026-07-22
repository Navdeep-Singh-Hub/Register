import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { workshop } from "../config";
import { useCountdown } from "../hooks/useCountdown";
import { openRazorpayCheckout } from "../lib/razorpay";
import { HeroOrbitScene } from "./HeroOrbitScene";
import { TiltCard } from "./TiltCard";
import {
  IconBrain,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconClock,
  IconFlask,
  IconLock,
  IconMapPin,
  IconMessage,
  IconMicrobe,
  IconMoon,
  IconPill,
  IconShield,
  IconStar,
  IconStethoscope,
  IconUsers,
  IconUtensils,
  IconWhatsApp,
  IconXCircle,
} from "./Icons";

const struggleItems = [
  "Speech progress is very slow",
  "Hyperactivity continues despite therapy",
  "Sleeps poorly",
  "Eats only a few foods",
  "Frequent constipation",
  "Poor attention",
  "Emotional meltdowns",
  "You’ve tried many therapies but still feel stuck",
];

const learnItems = [
  { icon: IconBrain, text: "Why some children improve faster than others" },
  { icon: IconUtensils, text: "Understanding nutrition and autism" },
  { icon: IconMicrobe, text: "Gut health and behaviour" },
  {
    icon: IconPill,
    text: "Which supplements have evidence—and which don’t",
  },
  { icon: IconStethoscope, text: "When biomedical evaluation may be useful" },
  { icon: IconFlask, text: "What tests are sometimes recommended" },
  { icon: IconMoon, text: "Sleep and brain development" },
  { icon: IconXCircle, text: "Common myths about biomedical treatment" },
];

const attendFor = [
  "Autism",
  "Speech delay",
  "ADHD with autism",
  "Developmental delay",
  "Feeding problems",
  "Sleep issues",
  "Behaviour concerns",
];

const faqs = [
  {
    q: "Will you prescribe medicines?",
    a: "No. The workshop is educational. We help you understand evidence and when a medical evaluation may be appropriate—not prescribe during the session.",
  },
  {
    q: "Is this online or offline?",
    a: `This workshop is ${workshop.venue.toLowerCase()}. You’ll receive joining details on WhatsApp and email after registration.`,
  },
  {
    q: "Can both parents attend?",
    a: "Yes. One registration covers both parents. We encourage both caregivers to attend when possible so you’re aligned on next steps.",
  },
  {
    q: "Will I receive notes?",
    a: "Yes. Registered parents receive resource material and a biomedical checklist after the workshop.",
  },
  {
    q: "Can I ask questions?",
    a: "Yes. A dedicated Q&A session is included so you can clarify what applies to your child’s situation.",
  },
];

const testimonials = [
  {
    quote:
      "My son started sleeping better after we understood his medical issues. This workshop gave us clarity.",
    name: "Ananya",
  },
  {
    quote:
      "We finally understood what questions to ask our doctors. I feel more confident making decisions for my child.",
    name: "Rohit",
  },
  {
    quote:
      "It didn’t promise miracles—just clear, evidence-based information. That honesty helped us trust the process.",
    name: "Meera",
  },
  {
    quote:
      "I left feeling empowered, not overwhelmed. We know which next steps are worth exploring with our care team.",
    name: "Sana",
  },
  {
    quote:
      "Communication with our paediatrician improved overnight because we finally had a shared vocabulary.",
    name: "Vikram",
  },
  {
    quote:
      "The session helped us connect nutrition, sleep, and behaviour without replacing the therapies that already help.",
    name: "Priya",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

function RevealSection({
  children,
  className,
  ...rest
}: ComponentProps<typeof motion.section>) {
  return (
    <motion.section
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

function RevealGrid({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function scrollToPricing() {
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
}

function ExpertAvatar({
  name,
  className = "",
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const initials = name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const gradientId = `g-${initials}-${size ?? "sm"}`;
  return (
    <div
      className={`expert-avatar ${className}`}
      aria-hidden
      style={size ? { width: size, height: size } : undefined}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8e8df" />
            <stop offset="100%" stopColor="#b7d7e4" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${gradientId})`} />
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fontFamily="Outfit, sans-serif"
          fontSize="18"
          fontWeight="600"
          fill="#0a4f44"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}

function Countdown() {
  const remaining = useCountdown(workshop.registrationClosesAt);
  if (remaining.total <= 0) return null;

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hrs", value: remaining.hours },
    { label: "Min", value: remaining.minutes },
    { label: "Sec", value: remaining.seconds },
  ];

  return (
    <div className="countdown" aria-label="Registration closes in">
      {units.map((unit) => (
        <div className="countdown-unit" key={unit.label}>
          <strong>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={unit.value}
                initial={{ y: -14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 14, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ display: "inline-block" }}
              >
                {String(unit.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </strong>
          <span>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".testimonial-card");
    const amount = card ? card.clientWidth + 16 : 280;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <RevealSection className="section testimonials" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Parent voices</p>
          <h2 id="testimonials-heading">Why Parents Feel Clearer After This</h2>
          <p>
            Real experiences focused on understanding, confidence, and better
            conversations with doctors—not cures.
          </p>
        </div>
        <motion.div
          className="testimonial-track"
          ref={trackRef}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((item) => (
            <motion.div className="testimonial-card-wrap" variants={fadeUp} key={item.name}>
              <TiltCard className="testimonial-card">
                <div className="stars" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} />
                  ))}
                </div>
                <blockquote>“{item.quote}”</blockquote>
                <cite>{item.name}</cite>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
        <div className="carousel-nav">
          <button
            type="button"
            className="prev"
            aria-label="Previous testimonial"
            onClick={() => scrollByCard(-1)}
          >
            <IconChevron />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => scrollByCard(1)}
          >
            <IconChevron />
          </button>
        </div>
      </div>
    </RevealSection>
  );
}

function PricingForm({ onPaid }: { onPaid: (paymentId: string) => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedMobile = mobile.replace(/\s+/g, "");
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedMobile || !trimmedEmail) {
      setError("Please fill in parent name, mobile number, and email.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(trimmedMobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await openRazorpayCheckout(
        {
          name: trimmedName,
          contact: trimmedMobile,
          email: trimmedEmail,
        },
        onPaid,
        (message) => setError(message),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment could not be started.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <RevealSection className="section pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Workshop fee</p>
          <h2 id="pricing-heading">Reserve Your Seat</h2>
          <p>Secure your place in this focused 2-hour parent workshop.</p>
        </div>

        <div className="pricing-box">
          <div className="price-row">
            <span className="amount">{workshop.feeDisplay}</span>
            <span className="note">per registration</span>
          </div>

          <p style={{ fontWeight: 600, marginBottom: "0.85rem" }}>
            What’s included
          </p>
          <ul className="check-list">
            {[
              "2-hour live workshop",
              "Q&A session",
              "Parent resource material",
              "Biomedical checklist",
            ].map((item) => (
              <li key={item}>
                <span className="icon-wrap">
                  <IconCheck />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <label>
              Parent Name
              <input
                name="parentName"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </label>
            <label>
              Mobile Number
              <input
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
              />
            </label>
            <label>
              Email Address
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
              {loading ? "Opening checkout…" : "Reserve My Seat"}
            </button>
          </form>

          <div className="trust-badges">
            <span>
              <IconLock /> Secure Razorpay payment
            </span>
            <span>
              <IconMessage /> WhatsApp & email confirmation
            </span>
            <span>
              <IconUsers /> Limited seats
            </span>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

export function LandingPage({
  onPaid,
}: {
  onPaid: (paymentId: string) => void;
}) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const pricing = document.getElementById("pricing");
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.7;
      const pricingVisible =
        pricing != null &&
        pricing.getBoundingClientRect().top < window.innerHeight * 0.85;
      setShowSticky(pastHero && !pricingVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-sticky-cta", showSticky);
    return () => document.body.classList.remove("has-sticky-cta");
  }, [showSticky]);

  const whatsappHref = `https://wa.me/${workshop.whatsappNumber}?text=${encodeURIComponent(workshop.whatsappMessage)}`;

  return (
    <>
      <header className="hero">
        <div className="hero-media" aria-hidden />
        <div className="hero-content">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="brand-mark">
                <span>Parent Workshop</span>
                {workshop.brand}
              </p>
              <h1>{workshop.headline}</h1>
              <p className="hero-sub">{workshop.subheadline}</p>

              <div className="hero-experts">
                <ExpertAvatar name={workshop.experts.priyanka.name} />
                <ExpertAvatar
                  name={workshop.experts.neha.name}
                  className="secondary"
                />
                <p>
                  With {workshop.experts.priyanka.name} &{" "}
                  {workshop.experts.neha.name}
                </p>
              </div>

              <div className="hero-meta">
                <div className="meta-chip">
                  <IconCalendar />
                  <div>
                    <strong>Date</strong>
                    <span>{workshop.date}</span>
                  </div>
                </div>
                <div className="meta-chip">
                  <IconClock />
                  <div>
                    <strong>Time</strong>
                    <span>
                      {workshop.time} ({workshop.duration})
                    </span>
                  </div>
                </div>
                <div className="meta-chip">
                  <IconMapPin />
                  <div>
                    <strong>Venue</strong>
                    <span>{workshop.venue}</span>
                  </div>
                </div>
                <div className="meta-chip">
                  <IconUsers />
                  <div>
                    <strong>Seats</strong>
                    <span>
                      {workshop.seatsRemaining} of {workshop.seatsTotal} left
                    </span>
                  </div>
                </div>
              </div>

              <div className="hero-cta">
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={scrollToPricing}
                >
                  Reserve My Seat
                </button>
                <div className="hero-trust">
                  <span>
                    <IconShield /> Evidence-informed
                  </span>
                  <span>
                    <IconLock /> Secure payment
                  </span>
                </div>
              </div>
              <Countdown />
            </div>

            <div className="hero-visual">
              <HeroOrbitScene />
            </div>
          </div>
        </div>
        <div className="hero-wave" aria-hidden>
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path
              d="M0,64 C240,20 480,20 720,48 C960,76 1200,76 1440,32 L1440,90 L0,90 Z"
              fill="var(--surface)"
            />
          </svg>
        </div>
      </header>

      <main>
        <RevealSection className="section" aria-labelledby="struggle-heading">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">The parent’s struggle</p>
              <h2 id="struggle-heading">Does This Sound Like Your Child?</h2>
            </div>
            <RevealGrid className="struggle-grid">
              {struggleItems.map((item) => (
                <motion.div className="struggle-item" key={item} variants={fadeUp}>
                  <span className="icon-wrap">
                    <IconCheck />
                  </span>
                  <span>{item}</span>
                </motion.div>
              ))}
            </RevealGrid>
            <p className="struggle-bottom">
              If you answered “Yes” to even one, this workshop is for you.
            </p>
          </div>
        </RevealSection>

        <RevealSection className="section" aria-labelledby="learn-heading">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">What you’ll learn</p>
              <h2 id="learn-heading">In Just 2 Hours You’ll Understand</h2>
            </div>
            <RevealGrid className="learn-grid">
              {learnItems.map(({ icon: Icon, text }) => (
                <motion.article className="learn-item" key={text} variants={fadeUp}>
                  <span className="icon-wrap">
                    <Icon />
                  </span>
                  <h3>{text}</h3>
                </motion.article>
              ))}
            </RevealGrid>
          </div>
        </RevealSection>

        <RevealSection className="section" aria-labelledby="experts-heading">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Meet your experts</p>
              <h2 id="experts-heading">Learn From Experienced Doctors</h2>
            </div>
            <RevealGrid className="experts-grid">
              {[workshop.experts.priyanka, workshop.experts.neha].map(
                (expert) => (
                  <motion.div key={expert.name} variants={fadeUp}>
                    <TiltCard className="expert-panel">
                      <div className="expert-top">
                        <ExpertAvatar
                          name={expert.name}
                          className="expert-photo"
                          size={88}
                        />
                        <div>
                          <h3>{expert.name}</h3>
                          <p className="creds">{expert.credentials}</p>
                          <p className="role">{expert.role}</p>
                          <p className="role">{expert.title}</p>
                        </div>
                      </div>
                      <p className="bio">{expert.bio}</p>
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                          Special interests
                        </p>
                        <div className="interest-list">
                          {expert.interests.map((interest) => (
                            <span key={interest}>{interest}</span>
                          ))}
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                ),
              )}
            </RevealGrid>
          </div>
        </RevealSection>

        <RevealSection className="section" aria-labelledby="trust-heading">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Why parents trust us</p>
              <h2 id="trust-heading">Care Built on Experience</h2>
            </div>
            <div className="trust-band">
              <RevealGrid className="trust-grid">
                {workshop.trustStats.map((stat) => (
                  <motion.div className="trust-item" key={stat.label} variants={fadeUp}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </motion.div>
                ))}
              </RevealGrid>
            </div>
          </div>
        </RevealSection>

        <Testimonials />

        <RevealSection className="section" aria-labelledby="who-heading">
          <div className="container">
            <RevealGrid className="split-panels">
              <motion.div className="panel" variants={fadeUp}>
                <h2 id="who-heading">Who Should Attend?</h2>
                <p style={{ marginBottom: "1rem", color: "var(--ink-muted)" }}>
                  Parents of children who have:
                </p>
                <ul className="check-list">
                  {attendFor.map((item) => (
                    <li key={item}>
                      <span className="icon-wrap">
                        <IconCheck />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div className="panel not" variants={fadeUp}>
                <h2>Who Should Not Attend?</h2>
                <p style={{ fontWeight: 600 }}>
                  People looking for a miracle cure.
                </p>
                <p className="note">This workshop focuses on:</p>
                <ul>
                  <li>Understanding current scientific evidence</li>
                  <li>Medical evaluation when appropriate</li>
                  <li>Integrating biomedical care with therapy</li>
                </ul>
              </motion.div>
            </RevealGrid>
          </div>
        </RevealSection>

        <RevealSection className="section" aria-labelledby="faq-heading">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">FAQs</p>
              <h2 id="faq-heading">Questions Parents Ask First</h2>
            </div>
            <RevealGrid className="faq-list">
              {faqs.map((faq) => (
                <motion.details className="faq-item" key={faq.q} variants={fadeUp}>
                  <summary>
                    {faq.q}
                    <IconChevron />
                  </summary>
                  <p>{faq.a}</p>
                </motion.details>
              ))}
            </RevealGrid>
          </div>
        </RevealSection>

        <PricingForm onPaid={onPaid} />
      </main>

      <footer className="site-footer">
        <div className="container">
          <strong>{workshop.brand}</strong>
          <p>Educational workshop. Not a substitute for personal medical care.</p>
        </div>
      </footer>

      <a
        className="whatsapp-float"
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Ask a workshop question on WhatsApp"
      >
        <IconWhatsApp />
      </a>

      <div className={`sticky-cta ${showSticky ? "visible" : ""}`}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={scrollToPricing}
        >
          Reserve My Seat
        </button>
      </div>
    </>
  );
}
