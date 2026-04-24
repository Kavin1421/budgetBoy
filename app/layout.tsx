import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConditionalHeader } from "@/components/ConditionalHeader";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "BudgetBoy | Smart Expense Optimizer",
  description: "Optimize telecom and subscription costs with actionable savings insights.",
  icons: {
    icon: "/budget.png",
    apple: "/budget.png",
  },
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
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
