import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "TuitionPro — Smart Tuition Management",
    template: "%s | TuitionPro",
  },
  description:
    "TuitionPro is a complete, enterprise-grade tuition management system for tutors, students, and parents. Manage classes, attendance, fees, and more.",
  keywords: [
    "tuition management",
    "online tutoring",
    "student management",
    "fee management",
    "TuitionPro",
  ],
  authors: [{ name: "TuitionPro" }],
  openGraph: {
    type: "website",
    title: "TuitionPro — Smart Tuition Management",
    description: "Enterprise-grade tuition management system",
    siteName: "TuitionPro",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
