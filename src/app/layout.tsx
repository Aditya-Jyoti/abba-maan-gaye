import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./animations.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
