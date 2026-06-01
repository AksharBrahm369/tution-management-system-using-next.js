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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
