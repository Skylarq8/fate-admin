import type { Metadata } from "next";
import { Inter, Poppins, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-inter',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-manrope',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${manrope.variable} bg-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
