import "@/index.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata = {
  title: "Legend Army - Guild Hub",
  description: "Official Guild Hub and Guild League Management System for Legend Army",
  icons: {
    icon: "/favicon.ico",
  },
};

/**
 * Root Application Layout
 * Provides base styles, font configuration, and unified toast notification context.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-100 text-content-strong antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
