import type { Metadata, Viewport } from 'next';
import { Urbanist, Cairo } from 'next/font/google';
import './globals.css';
import { CRMProvider } from '@/lib/store/crm-context';
import { Shell } from '@/components/layout/shell';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { ThemeProvider } from '@/lib/theme/theme-context';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFF3F8' },
    { media: '(prefers-color-scheme: dark)', color: '#141820' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'CRMate — Intelligent Sales CRM',
    template: '%s | CRMate',
  },
  description: 'High-velocity sales management & pipeline intelligence for Al Mespar',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/icon',
  },
  openGraph: {
    title: 'CRMate — Intelligent Sales CRM',
    description: 'High-velocity sales management & pipeline intelligence for Al Mespar',
    type: 'website',
    locale: 'ar_SA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${urbanist.variable} ${cairo.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-[#292D32] dark:text-[#E8EDF4] bg-[#EFF3F8] dark:bg-[#141820] selection:bg-[#8FC2F0]/30 selection:text-[#292D32] dark:selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <CRMProvider>
              <Shell>
                {children}
              </Shell>
            </CRMProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
