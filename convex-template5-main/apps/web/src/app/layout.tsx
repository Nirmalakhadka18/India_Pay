import "@v1/ui/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TopAnnouncementBar } from "@/components/top-announcement-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { Provider as AnalyticsProvider } from "@v1/analytics/client";
import { cn } from "@v1/ui/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConvexClientProvider } from "./convex-client-provider";

const DepartureMono = localFont({
  src: "../fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001"),
  title: {
    default: "IndiaPay — Enterprise Indian Payroll, HRMS & Workforce Platform",
    template: "%s | IndiaPay Enterprise",
  },
  description:
    "Deterministic payroll processing, statutory compliance (PF, ESI, PT), real-time attendance sync, and Gemini AI copilot engineered for Indian businesses.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IndiaPay — Enterprise Indian Payroll, HRMS & Workforce Platform",
    description:
      "Deterministic payroll processing, statutory compliance (PF, ESI, PT), real-time attendance sync, and Gemini AI copilot engineered for Indian businesses.",
    url: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001",
    siteName: "IndiaPay",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiaPay — Enterprise Indian Payroll, HRMS & Workforce Platform",
    description:
      "Deterministic payroll processing, statutory compliance (PF, ESI, PT), real-time attendance sync, and Gemini AI copilot engineered for Indian businesses.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark overflow-x-hidden">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('indiapay-theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          `${DepartureMono.variable} ${GeistSans.variable} ${GeistMono.variable}`,
          "antialiased overflow-x-hidden w-full bg-slate-50 text-slate-900 dark:bg-[#080D19] dark:text-[#F8FAFC] transition-colors duration-200",
        )}
      >
        <ThemeProvider>
          <ConvexClientProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: "IndiaPay",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Cloud Web Application",
                  offers: {
                    "@type": "AggregateOffer",
                    priceCurrency: "INR",
                    lowPrice: "45",
                    offerCount: "3",
                  },
                  description:
                    "Deterministic Indian payroll, statutory compliance (EPFO/ESIC/PT), attendance and workforce operations platform.",
                }),
              }}
            />
            <TopAnnouncementBar />
            <Header />
            {children}
            <Footer />
          </ConvexClientProvider>

          <AnalyticsProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
