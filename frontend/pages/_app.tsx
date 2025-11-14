import type { AppProps } from 'next/app';
import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import OfflineIndicator from '../components/common/OfflineIndicator';
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const ConnectionStatus = dynamic(() => import('../components/common/ConnectionStatus'), { ssr: false });
import Head from 'next/head';
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const start = () => setRouteLoading(true);
    const end = () => setRouteLoading(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <div className={`flex min-h-screen flex-col bg-[#F0FDF4] ${inter.variable} ${poppins.variable}`}>
            <Head>
              <title>CampusPlay - Campus Sports Booking</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="theme-color" content="#2563EB" />
              <meta name="description" content="Book your favorite sports ground on campus with ease" />
            </Head>
            {routeLoading && (
              <div className="fixed inset-x-0 top-0 z-50">
                <div className="h-1 w-full animate-pulse bg-gradient-sport" />
              </div>
            )}
            <ConnectionStatus />
            <Navbar />
            <main className="w-full flex-1">
              <Component {...pageProps} />
            </main>
            <OfflineIndicator />
          </div>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
