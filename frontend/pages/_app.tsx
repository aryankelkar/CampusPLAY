import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import OfflineIndicator from '../components/common/OfflineIndicator';
import AppShell from '../components/AppShell';
import ConnectionStatus from '../components/common/ConnectionStatus';
import Head from 'next/head';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    // Ignore third-party browser extension errors from interrupting Next.js dev overlay
    const handleExtensionError = (event: ErrorEvent) => {
      if (
        event.filename?.includes('chrome-extension://') ||
        event.filename?.includes('moz-extension://') ||
        event.message?.includes('M_ID')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    window.addEventListener('error', handleExtensionError, true);

    const start = () => setRouteLoading(true);
    const end = () => setRouteLoading(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      window.removeEventListener('error', handleExtensionError, true);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <div className={`${plusJakartaSans.variable} ${inter.variable}`}>
            <Head>
              <title>CampusPlay - University Sports Booking</title>
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
              <meta name="theme-color" content="#2563EB" />
              <meta name="description" content="Book campus sports grounds and manage reservations easily." />
            </Head>
            {routeLoading && (
              <div className="fixed inset-x-0 top-0 z-[1100]">
                <div className="h-1 w-full animate-pulse bg-[#2563EB]" />
              </div>
            )}
            <ConnectionStatus />
            <AppShell>
              <Component {...pageProps} />
            </AppShell>
            <OfflineIndicator />
          </div>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}


