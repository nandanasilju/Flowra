import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: { default: "Flowra · Your cycle, understood", template: "%s · Flowra" },
  description: "Flowra: AI-powered period tracker and menstrual health companion. Track cycles, log symptoms by voice, understand patterns and find care.",
  manifest: "/manifest.webmanifest",
  applicationName: "Flowra",
  appleWebApp: { capable: true, title: { default: "Flowra · Your cycle, understood", template: "%s · Flowra" }, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#5B2A86",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
