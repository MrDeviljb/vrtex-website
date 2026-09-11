import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Vrtex Esports | Elite BGMI Tournaments & Scrims Platform",
  description:
    "Compete in official BGMI tournaments and scrims. Build your squad, climb the verified leaderboard, and win real cash prize pools. Anti-cheat protected.",
  keywords: ["BGMI", "Battlegrounds Mobile India", "BGMI Tournaments", "BGMI Scrims", "Esports", "Vrtex Esports"],
  authors: [{ name: "Vrtex Esports Operations" }],
  openGraph: {
    title: "Vrtex Esports | Dominate the Battleground",
    description: "Official BGMI esports platform for tournaments, scrims, and verified squad rankings.",
    type: "website",
    url: "https://vrtexesports.com",
    siteName: "Vrtex Esports",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vrtex Esports | BGMI Competitive Platform",
    description: "Compete in daily scrims and high-stakes BGMI tournaments.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080a0f] text-slate-100 antialiased selection:bg-neon-green selection:text-black">
        <Navbar />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
