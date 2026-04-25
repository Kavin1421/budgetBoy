import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "BudgetBoy | Smart Expense Optimizer",
  description: "Optimize telecom and subscription costs with actionable savings insights.",
  metadataBase: new URL("https://budget-boy-ochre.vercel.app"),
  applicationName: "BudgetBoy",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BudgetBoy | Smart Expense Optimizer",
    description: "Optimize telecom and subscription costs with actionable savings insights.",
    url: "/",
    siteName: "BudgetBoy",
    type: "website",
    images: [{ url: "/budget.png", width: 512, height: 512, alt: "BudgetBoy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BudgetBoy | Smart Expense Optimizer",
    description: "Optimize telecom and subscription costs with actionable savings insights.",
    images: ["/budget.png"],
  },
  appleWebApp: {
    capable: true,
    title: "BudgetBoy",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/budget.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/budget.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className={`${geist.className} font-sans`}>
        <div className="bb-mesh" aria-hidden />
        <div className="bb-content flex min-h-screen flex-col">
          <ConditionalHeader />
          <div className="flex-1">{children}</div>
        </div>
        <ServiceWorkerRegister />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
