import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { WithSurveyErrorBoundary } from '@/components/survey/survey-error-boundary';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Surveyor - Multi-Stakeholder Survey Platform',
  description: 'Comprehensive survey platform supporting multiple stakeholders with configurable schemas',
  keywords: ['survey', 'multi-stakeholder', 'assessment', 'evaluation'],
  authors: [{ name: 'Claude PM Framework' }],
  robots: 'index, follow',
  other: {
    'X-UA-Compatible': 'IE=edge',
    'theme-color': '#ffffff',
    'msapplication-TileColor': '#ffffff',
    'msapplication-config': '/browserconfig.xml',
    'format-detection': 'telephone=no',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {/* Skip Links */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50">
            Skip to main content
          </a>
          <header className="sr-only">
            <h1>Surveyor - Multi-Stakeholder Survey Platform</h1>
          </header>
          <main id="main-content" className="relative" role="main">
            <WithSurveyErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
              {children}
            </WithSurveyErrorBoundary>
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}