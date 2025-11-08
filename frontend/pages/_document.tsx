import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Meta tags */}
        <meta name="description" content="CampusPlay - Your campus sports booking platform" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
