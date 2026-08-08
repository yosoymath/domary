import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NavigationFeedback } from "@/components/layout/navigation-feedback";
import { PageTransition } from "@/components/layout/page-transition";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const themeInitializationScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("domary-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var dark = savedTheme ? savedTheme === "dark" : prefersDark;
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} /></head>
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
