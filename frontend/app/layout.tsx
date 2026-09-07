import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTC-SCOPE | Bitcoin Activity Intelligence",
  description: "Synthetic Bitcoin transaction traffic analysis prototype.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
