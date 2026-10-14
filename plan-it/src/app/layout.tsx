import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskPulse | Collaborative Project & Sprint Management",
  description: "Production-grade collaborative Kanban board with real-time updates and notification sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid #27272a',
              fontSize: '12px',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
