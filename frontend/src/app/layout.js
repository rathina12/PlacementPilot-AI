import "./globals.css";

export const metadata = {
  title: "Student Digital Twin",
  description: "AI-Powered Student Placement Readiness Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
