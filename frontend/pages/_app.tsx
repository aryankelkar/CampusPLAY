import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import Head from 'next/head';

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
      <div className="flex min-h-screen flex-col">
        <Head>
          <title>CampusPlay</title>
          <meta name="theme-color" content="#2563EB" />
          <link rel="icon" href="/logo.png" />
          <link rel="apple-touch-icon" href="/logo.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
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
    </AuthProvider>
  );
}
