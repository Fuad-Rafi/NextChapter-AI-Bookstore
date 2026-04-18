import '../index.css';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'NextChapter AI',
    template: '%s | NextChapter AI',
  },
  description: 'NextChapter Assistant for book discovery, ordering, and personalized recommendations.',
  openGraph: {
    title: 'NextChapter AI',
    description: 'Book discovery, ordering, and personalized recommendations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextChapter AI',
    description: 'Book discovery, ordering, and personalized recommendations.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased transition-colors duration-300 dark:bg-[#0A0F1C] bg-[#FFFBF9]">
        <ThemeProvider>
          {/* Abstract animated gradient background for Glassmorphism */}
          <div className="fixed inset-0 z-[-1] min-h-screen overflow-hidden">
            {/* Light Mode Blobs - More Vibrant */}
            <div className="dark:hidden absolute top-0 -left-4 w-80 h-80 bg-linear-to-br from-red-200 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="dark:hidden absolute top-1/2 right-0 w-80 h-80 bg-linear-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="dark:hidden absolute bottom-0 left-1/3 w-80 h-80 bg-linear-to-tr from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="dark:hidden absolute top-1/4 left-1/2 w-72 h-72 bg-linear-to-r from-amber-200 to-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-3000"></div>

            {/* Dark Mode Blobs - Neon/Vibrant Theme */}
            <div className="hidden dark:block absolute top-0 -left-4 w-80 h-80 bg-linear-to-br from-blue-500 via-cyan-400 to-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
            <div className="hidden dark:block absolute top-1/2 right-0 w-80 h-80 bg-linear-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="hidden dark:block absolute bottom-0 left-1/3 w-80 h-80 bg-linear-to-tr from-amber-500 via-orange-500 to-red-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
            <div className="hidden dark:block absolute top-1/4 left-1/2 w-72 h-72 bg-linear-to-r from-green-500 via-emerald-400 to-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-35 animate-blob animation-delay-3000"></div>
            <div className="hidden dark:block absolute -bottom-8 right-1/4 w-96 h-96 bg-linear-to-tr from-indigo-600 via-purple-500 to-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-1000"></div>
          </div>

          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
