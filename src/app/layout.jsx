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
 * Root Application Shell Layout
 *
 * Why this exists:
 * Sets up global CSS tokens, enforces light mode presentation without dark mode flash,
 * and provides persistent application-wide notification context via ToastProvider.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-[#faf9f6] text-[#18181b] font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

