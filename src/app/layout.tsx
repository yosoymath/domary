import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, Inter_Tight } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NavigationFeedback } from "@/components/layout/navigation-feedback";
import { PageTransition } from "@/components/layout/page-transition";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const displayFont = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display-face",
  display: "swap",
});

const bodyFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const themeInitializationScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("domary-theme");
      var dark = savedTheme === "dark"
        || (savedTheme !== "light" && savedTheme !== "classic" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      localStorage.removeItem("domary-accent");
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    } catch (_) {}
  })();
`;

export const metadata: Metadata = {
  title: {
    default: "Domary — Vista sua atitude",
    template: "%s | Domary",
  },
  description: "Roupas e acessórios com personalidade, qualidade e estilo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${displayFont.variable} ${bodyFont.variable}`} lang="pt-BR" suppressHydrationWarning>
      <head><Script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} id="domary-theme-initialization" strategy="beforeInteractive" /></head>
      <body className="min-h-screen antialiased">
        <ToastProvider>
          <Suspense fallback={null}><NavigationFeedback /></Suspense>
          <Header />
          <main><PageTransition>{children}</PageTransition></main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
