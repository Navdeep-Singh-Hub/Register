import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
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
  IconXCircle,
} from "./Icons";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

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
  { icon: IconPill, text: "Which supplements have evidence—and which don’t" },
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

/* ------------------------------------------------------------------ */
/* Motion primitives                                                   */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 34, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
    // Remove the residual filter so gradient text (background-clip: text)
    // inside revealed sections keeps painting in Chromium.
    transitionEnd: { filter: "none" },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
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
      viewport={{ once: true, amount: 0.18 }}
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
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

/** Fixed gradient bar showing page scroll progress. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.4,
  });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden />;
}

/** Wrapper that makes its child gently follow the cursor. */
function Magnetic({
  children,
  strength = 0.28,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 16, mass: 0.4 });

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className="magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}

/** Headline that reveals word by word; accent words get a gradient. */
function AnimatedHeadline({ text }: { text: string }) {
  const accents = new Set(["still", "not", "improving"]);
  const words = text.split(" ");
  return (
    <h1 aria-label={text}>
      {words.map((word, i) => {
        const isAccent = accents.has(word.toLowerCase().replace(/[?!.,]/g, ""));
        return (
          <motion.span
            key={`${word}-${i}`}
            className={`headline-word ${isAccent ? "accent" : ""}`}
            initial={{ opacity: 0, y: "0.6em", rotateX: -40, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.055, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </h1>
  );
}

/** Counts up from 0 when scrolled into view. */
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.9,
      ease: EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page pieces                                                         */
/* ------------------------------------------------------------------ */

function scrollToPricing() {
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
}

function ExpertAvatar({
  name,
  photo,
  className = "",
  size,
}: {
  name: string;
  photo?: string;
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
      {photo ? (
        <img src={photo} alt="" width={size ?? 88} height={size ?? 88} />
      ) : (
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
      )}
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
      <span className="countdown-label">Registration closes in</span>
      <div className="countdown-units">
        {units.map((unit) => (
          <div className="countdown-unit" key={unit.label}>
            <strong>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={unit.value}
                  initial={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.3, ease: EASE }}
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
    </div>
  );
}

/** Infinite auto-scrolling testimonial marquee; pauses on hover. */
function TestimonialMarquee() {
  const doubled = [...testimonials, ...testimonials];
  return (
    <RevealSection
      className="section testimonials"
      aria-labelledby="testimonials-heading"
    >
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Parent voices</p>
          <h2 id="testimonials-heading">Why Parents Feel Clearer After This</h2>
          <p>
            Real experiences focused on understanding, confidence, and better
            conversations with doctors—not cures.
          </p>
        </div>
      </div>
      <div className="marquee" aria-label="Parent testimonials">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <figure
              className="testimonial-card"
              key={`${item.name}-${i}`}
              aria-hidden={i >= testimonials.length}
            >
              <div className="stars" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <IconStar key={s} />
                ))}
              </div>
              <blockquote>“{item.quote}”</blockquote>
              <figcaption>{item.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div className={`faq-item ${open ? "open" : ""}`} variants={fadeUp}>
      <button
        type="button"
        className="faq-question"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <motion.span
          className="faq-icon"
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <IconChevron />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
        { name: trimmedName, contact: trimmedMobile, email: trimmedEmail },
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
    <RevealSection
      className="section pricing"
      id="pricing"
      aria-labelledby="pricing-heading"
    >
      <div className="container">
        <div className="section-head centered">
          <p className="eyebrow">Workshop fee</p>
          <h2 id="pricing-heading">Reserve Your Seat</h2>
          <p>Secure your place in this focused 2-hour parent workshop.</p>
        </div>

        <div className="pricing-box">
          <div className="pricing-inner">
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
              <Magnetic strength={0.18}>
                <button
                  className="btn btn-primary btn-large"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Opening checkout…" : "Reserve My Seat"}
                </button>
              </Magnetic>
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
      </div>
    </RevealSection>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LandingPage({
  onPaid,
}: {
  onPaid: (paymentId: string) => void;
}) {
  const [showSticky, setShowSticky] = useState(false);
  const [seatsRemaining, setSeatsRemaining] = useState<number>(
    workshop.seatsRemaining,
  );
  const [seatsTotal, setSeatsTotal] = useState<number>(workshop.seatsTotal);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(heroProgress, [0, 1], [0, 90]);
  const copyOpacity = useTransform(heroProgress, [0, 0.85], [1, 0.15]);
  const visualY = useTransform(heroProgress, [0, 1], [0, 150]);

  async function refreshSeats() {
    try {
      const res = await fetch("/api/seats");
      if (!res.ok) return;
      const data = (await res.json()) as {
        remaining?: number;
        total?: number;
      };
      if (typeof data.remaining === "number" && Number.isFinite(data.remaining)) {
        setSeatsRemaining(Math.max(0, data.remaining));
      }
      if (typeof data.total === "number" && Number.isFinite(data.total) && data.total > 0) {
        setSeatsTotal(data.total);
      }
    } catch {
      // Keep configured defaults if the seats API is unavailable.
    }
  }

  useEffect(() => {
    void refreshSeats();
  }, []);

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

  function handlePaid(paymentId: string) {
    setSeatsRemaining((n) => Math.max(0, n - 1));
    void refreshSeats();
    onPaid(paymentId);
  }

  return (
    <>
      <ScrollProgress />

      <header className="hero" ref={heroRef}>
        <div className="hero-media" aria-hidden />
        <div className="hero-aurora" aria-hidden>
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
        </div>
        <div className="hero-grain" aria-hidden />

        <div className="hero-content">
          <div className="container hero-grid">
            <motion.div
              className="hero-copy"
              style={{ y: copyY, opacity: copyOpacity }}
            >
              <motion.p
                className="brand-mark"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <span>Parent Workshop</span>
                {workshop.brand}
              </motion.p>

              <AnimatedHeadline text={workshop.headline} />

              <motion.p
                className="hero-sub"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
              >
                {workshop.subheadline}
              </motion.p>

              <motion.div
                className="hero-experts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
              >
                <ExpertAvatar
                  name={workshop.experts.priyanka.name}
                  photo={workshop.experts.priyanka.photo}
                />
                <ExpertAvatar
                  name={workshop.experts.neha.name}
                  className="secondary"
                />
                <p>
                  With {workshop.experts.priyanka.name} &{" "}
                  {workshop.experts.neha.name}
                </p>
              </motion.div>

              <motion.div
                className="hero-meta"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.08, delayChildren: 0.72 },
                  },
                }}
              >
                {[
                  { Icon: IconCalendar, label: "Date", value: workshop.date },
                  {
                    Icon: IconClock,
                    label: "Time",
                    value: `${workshop.time} (${workshop.duration})`,
                  },
                  { Icon: IconMapPin, label: "Venue", value: workshop.venue },
                  {
                    Icon: IconUsers,
                    label: "Seats",
                    value: `${seatsRemaining} of ${seatsTotal} seats`,
                  },
                ].map(({ Icon, label, value }) => (
                  <motion.div
                    className="meta-chip"
                    key={label}
                    variants={{
                      hidden: { opacity: 0, y: 18, scale: 0.96 },
                      show: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.55, ease: EASE },
                      },
                    }}
                  >
                    <Icon />
                    <div>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="hero-cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.05, ease: EASE }}
              >
                <Magnetic>
                  <button
                    type="button"
                    className="btn btn-primary btn-large"
                    onClick={scrollToPricing}
                  >
                    Reserve My Seat
                  </button>
                </Magnetic>
                <div className="hero-trust">
                  <span>
                    <IconShield /> Evidence-informed
                  </span>
                  <span>
                    <IconLock /> Secure payment
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <Countdown />
              </motion.div>
            </motion.div>

            <motion.div className="hero-visual" style={{ y: visualY }}>
              <HeroOrbitScene />
            </motion.div>
          </div>
        </div>

        <motion.div
          className="scroll-hint"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <span className="scroll-hint-dot" />
        </motion.div>

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
            <motion.p
              className="struggle-bottom"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              If you answered “Yes” to even one, this workshop is for you.
            </motion.p>
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
                          photo={"photo" in expert ? expert.photo : undefined}
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
              <span className="trust-orb o1" aria-hidden />
              <span className="trust-orb o2" aria-hidden />
              <RevealGrid className="trust-grid">
                {workshop.trustStats.map((stat) => (
                  <motion.div
                    className="trust-item"
                    key={stat.label}
                    variants={fadeUp}
                  >
                    <strong>
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </strong>
                    <span>{stat.label}</span>
                  </motion.div>
                ))}
              </RevealGrid>
            </div>
          </div>
        </RevealSection>

        <TestimonialMarquee />

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
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </RevealGrid>
          </div>
        </RevealSection>

        <PricingForm onPaid={handlePaid} />
      </main>

      <footer className="site-footer">
        <div className="container">
          <strong>{workshop.brand}</strong>
          <p>Educational workshop. Not a substitute for personal medical care.</p>
        </div>
      </footer>

      <AnimatePresence>
        {showSticky && (
          <motion.div
            className="sticky-cta"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={scrollToPricing}
            >
              Reserve My Seat — {workshop.feeDisplay}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
