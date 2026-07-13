import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppToaster } from '@/components/ui/kit/Toast';
import { StoreProvider } from '@/store/StoreProvider';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Charting the Years - Admin Panel',
  description: 'Interactive atlas of historical literature',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${plusJakartaSans.className} font-sans antialiased bg-background text-foreground`}>
        <StoreProvider>
          {children}
        </StoreProvider>
        <AppToaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
