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
  seatsRemaining: 12,
  registrationClosesAt: "2026-08-14T23:59:59+05:30",

  feeInr: 1499,
  feeDisplay: "₹1,499",

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
      interests: [
        "Autism",
        "ADHD",
        "Biomedical interventions",
        "Parent guidance",
      ],
      bio: "Dr. Priyanka Kalra brings clinical depth and parent-centred care to every session, helping families understand when medical factors may be influencing development.",
    },
    neha: {
      name: "Dr. Neha",
      credentials: "MBBS, MD (Paediatrics)",
      role: "Paediatrician & Developmental Care",
      title: "Faculty, Global Child Wellness Centre",
      interests: [
        "Developmental paediatrics",
        "Nutrition",
        "Gut health",
        "Sleep medicine",
      ],
      bio: "Dr. Neha focuses on the medical and nutritional foundations that support therapy outcomes—helping parents connect sleep, gut health, and feeding patterns to behaviour and learning.",
    },
  },

  trustStats: [
    { value: "Thousands", label: "of therapy sessions delivered" },
    { value: "Hundreds", label: "of autism assessments" },
    { value: "Multidisciplinary", label: "clinical team" },
    { value: "Evidence-informed", label: "approach" },
  ],
} as const;
