import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elite Central Vacuum",
  description:
    "Elite Central Vacuum frontend experience for service requests, maintenance, and central vacuum support.",
};

export const viewport: Viewport = {
  themeColor: "#fcfcfb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
