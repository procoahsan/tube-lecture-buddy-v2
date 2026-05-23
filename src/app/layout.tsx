import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Tube Lecture Buddy - Your AI-Powered YouTube Lecture Assistant",
  description: "Transform YouTube lecture videos into notes, PPTs, transcripts, and more. Detect lectures, generate study materials, translate to 7 languages, and clip important segments.",
  keywords: "youtube lecture, video notes, ppt generator, transcript, video clipping, study tool",
  icons: {
    icon: "/logo.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main>{children}</main>
            <footer className="footer">
              <p>© 2026 Tube Lecture Buddy. Built with ❤️ for learners everywhere.</p>
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
