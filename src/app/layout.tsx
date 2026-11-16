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
      var validThemes = ["classic", "light", "dark", "system"];
      var theme = validThemes.indexOf(savedTheme) >= 0 ? savedTheme : "system";
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var dark = theme === "dark" || (theme === "system" && prefersDark);
      var accent = localStorage.getItem("domary-accent");

      if (!/^#[0-9a-f]{6}$/i.test(accent || "")) accent = "#f5c400";

      var value = parseInt(accent.slice(1), 16);
      var channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
      var light = channels.map(function (channel) {
        return Math.round(channel + (255 - channel) * 0.52);
      });
      var lightAccent = "#" + light.map(function (channel) {
        return channel.toString(16).padStart(2, "0");
      }).join("");
      var linear = channels.map(function (channel) {
        var normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      var luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;

      document.documentElement.dataset.themeMode = theme;
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      document.documentElement.style.setProperty("--color-domary-yellow", accent.toLowerCase());
      document.documentElement.style.setProperty("--color-domary-yellow-light", lightAccent);
      document.documentElement.style.setProperty("--color-domary-accent-contrast", luminance > 0.42 ? "#111111" : "#ffffff");
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
