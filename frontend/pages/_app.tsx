import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
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
    <AuthProvider>
      <SocketProvider>
        <div className={`flex min-h-screen flex-col ${inter.variable} ${poppins.variable}`}>
          <Head>
            <title>CampusPlay</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#2563EB" />
          </Head>
          {routeLoading && (
            <div className="fixed inset-x-0 top-0 z-50">
              <div className="h-1 w-full animate-pulse bg-blue-600" />
            </div>
          )}
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            <Component {...pageProps} />
          </main>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}
