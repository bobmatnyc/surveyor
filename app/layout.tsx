import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Surveyor - Multi-Stakeholder Survey Platform',
  description: 'Comprehensive survey platform supporting multiple stakeholders with configurable schemas',
  keywords: ['survey', 'multi-stakeholder', 'assessment', 'evaluation'],
  authors: [{ name: 'Claude PM Framework' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <main className="relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}