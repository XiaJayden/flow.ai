import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NavbarWrapper } from "@/components/navigation/navbar-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flow.ai - Collaborative Band Practice",
  description: "Collaborative practice tool for musical bands with synchronized annotations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <NavbarWrapper />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}