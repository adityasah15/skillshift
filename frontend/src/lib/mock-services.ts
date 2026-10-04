export type MockServiceStatus = "ACTIVE" | "PENDING_REVIEW" | "PAUSED";

export interface MockService {
  id: string;
  title: string;
  price: number; // paise
  deliveryDays: number;
  rating: number;
  totalReviews: number;
  skills: string[];
  status: MockServiceStatus;
  freelancer: { name: string; avatarColor: string };
  hue: number;
}

export const MOCK_SKILLS = [
  "Logo design",
  "Web development",
  "SEO writing",
  "UI design",
  "Video editing",
  "Data entry",
] as const;

export const MOCK_SERVICES: MockService[] = [
  {
    id: "svc-brand-identity",
    title: "Brand identity kit with logo, palette and guidelines",
    price: 1499900,
    deliveryDays: 5,
    rating: 4.9,
    totalReviews: 132,
    skills: ["Logo design", "UI design"],
    status: "ACTIVE",
    freelancer: { name: "Ananya Rao", avatarColor: "#3f4fe0" },
    hue: 232,
  },
  {
    id: "svc-landing-page",
    title: "High-converting landing page in Next.js + Tailwind",
    price: 2499900,
    deliveryDays: 7,
    rating: 4.8,
    totalReviews: 89,
    skills: ["Web development", "UI design"],
    status: "ACTIVE",
    freelancer: { name: "Rohan Mehta", avatarColor: "#7357ff" },
    hue: 252,
  },
  {
    id: "svc-seo-articles",
    title: "Four SEO articles that read like a human wrote them",
    price: 799900,
    deliveryDays: 4,
    rating: 4.9,
    totalReviews: 214,
    skills: ["SEO writing"],
    status: "ACTIVE",
    freelancer: { name: "Priya Nair", avatarColor: "#16875d" },
    hue: 160,
  },
  {
    id: "svc-dashboard-ui",
    title: "Dashboard UI kit with 40 screens and design tokens",
    price: 1999900,
    deliveryDays: 6,
    rating: 4.7,
    totalReviews: 58,
    skills: ["UI design", "Web development"],
    status: "PENDING_REVIEW",
    freelancer: { name: "Karan Shah", avatarColor: "#b76a1f" },
    hue: 32,
  },
  {
    id: "svc-product-video",
    title: "Product explainer video with captions and thumbnail",
    price: 1299900,
    deliveryDays: 5,
    rating: 4.8,
    totalReviews: 76,
    skills: ["Video editing"],
    status: "ACTIVE",
    freelancer: { name: "Sneha Kulkarni", avatarColor: "#2478d4" },
    hue: 214,
  },
  {
    id: "svc-data-cleanup",
    title: "Spreadsheet cleanup and CRM-ready data entry",
    price: 399900,
    deliveryDays: 3,
    rating: 4.9,
    totalReviews: 301,
    skills: ["Data entry"],
    status: "ACTIVE",
    freelancer: { name: "Amit Verma", avatarColor: "#141824" },
    hue: 220,
  },
];
