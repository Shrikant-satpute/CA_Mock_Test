import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CA Exam Portal | Chapter 3 – Remuneration to Directors',
  description:
    'Professional CA Mock Examination Portal — Companies Act 2013, Chapter 3: Remuneration to Directors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-inter bg-[#0a0a0f] text-[#f1f5f9] min-h-screen">
        {children}
      </body>
    </html>
  );
}
