import "@/index.css";

export const metadata = {
  title: "Legend Army - Guild Hub",
  description: "Official Guild Hub and Guild League Management System for Legend Army",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-100 text-content-strong antialiased">
        {children}
      </body>
    </html>
  );
}
