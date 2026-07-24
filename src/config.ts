/** Workshop landing page — edit these values before launch */
export const workshop = {
  brand: "Global Child Wellness Centre",
  brandShort: "GCWC",

  headline: "Is Your Child Still Not Improving Despite Therapy?",
  subheadline:
    "Discover how nutrition, sleep, gut health, and other medical factors may influence your child’s development—and learn when biomedical evaluation may be appropriate.",

  date: "Saturday, 15 August 2026",
  time: "11:00 AM – 1:00 PM IST",
  duration: "2 Hours",
  venue: "Online (Zoom)",
  seatsTotal: 40,
  /** Opening remaining seats before live Razorpay payments are subtracted */
  seatsRemaining: 29,
  registrationClosesAt: "2026-08-14T23:59:59+05:30",

  feeInr: 499,
  feeDisplay: "₹499",

  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_xxxxxxxx",
  whatsappNumber: "919876543210",
  whatsappGroupUrl: "https://chat.whatsapp.com/YOUR_GROUP_INVITE",
  whatsappMessage:
    "Hi, I have a question about the biomedical workshop for parents.",

  metaPixelId: import.meta.env.VITE_META_PIXEL_ID ?? "",

  experts: {
    priyanka: {
      name: "Dr. Priyanka Kalra",
      credentials: "MD, DNB Psychiatry",
      role: "Child & Adolescent Psychiatrist",
      title: "Founder, Global Child Wellness Centre",
      photo: "/experts/dr-priyanka-kalra.png",
      interests: [
        "Autism",
        "ADHD",
        "Biomedical interventions",
        "Parent guidance",
      ],
      bio: "Dr. Priyanka Kalra brings clinical depth and parent-centred care to every session, helping families understand when medical factors may be influencing development.",
    },
    neha: {
      name: "Dr. Neha Goyal",
      credentials: "MD Psychiatry",
      role: "Child & Adolescent Psychiatrist",
      title: "Goyal Hospital",
      interests: [
        "Developmental disorders",
        "Behavioural concerns",
        "Child psychology",
        "Parent guidance",
      ],
      bio: "Dr. Neha Goyal, MD (Psychiatry), is a compassionate Child & Adolescent Psychiatrist with over 14 years of clinical experience in diagnosing and treating developmental, behavioral, and emotional disorders in children and adolescents. She completed her MD in Psychiatry from Dayanand Medical College, Ludhiana, and also holds a Diploma in Child Psychology.",
    },
  },

  trustStats: [
    { value: 5000, suffix: "+", label: "therapy sessions delivered" },
    { value: 800, suffix: "+", label: "autism assessments" },
    { value: 12, suffix: "+", label: "specialists on our team" },
    { value: 100, suffix: "%", label: "evidence-informed approach" },
  ],
} as const;
