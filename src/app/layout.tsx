import type { Metadata } from 'next';
import { Urbanist, Cairo } from 'next/font/google';
import './globals.css';
import { CRMProvider } from '@/lib/store/crm-context';
import { Shell } from '@/components/layout/shell';

const urbanist = Urbanist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-urbanist',
  weight: ['400', '500', '600', '700', '800', '900']
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: 'CRMate — Intelligent Sales CRM',
  description: 'High-velocity sales management & pipeline intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="ltr" suppressHydrationWarning className={`${urbanist.variable} ${cairo.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-[#292D32] bg-[#EFF3F8] selection:bg-[#8FC2F0]/30 selection:text-[#292D32]">
        <CRMProvider>
          <Shell>
            {children}
          </Shell>
        </CRMProvider>
      </body>
    </html>
  );
}
