import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Suppress third-party browser extension errors (e.g. Urban VPN, MetaMask) from triggering Next.js dev overlay */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionError(msg, source, stack) {
                  var combined = (String(msg || '') + ' ' + String(source || '') + ' ' + String(stack || '')).toLowerCase();
                  return (
                    combined.indexOf('chrome-extension://') !== -1 ||
                    combined.indexOf('moz-extension://') !== -1 ||
                    combined.indexOf('safari-extension://') !== -1 ||
                    combined.indexOf('m_id') !== -1 ||
                    combined.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1
                  );
                }

                var origOnError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  var stack = error && error.stack ? error.stack : '';
                  if (isExtensionError(message, source, stack)) {
                    return true;
                  }
                  if (origOnError) {
                    return origOnError.apply(this, arguments);
                  }
                };

                window.addEventListener(
                  'error',
                  function(event) {
                    var msg = event.message || '';
                    var filename = event.filename || '';
                    var stack = event.error && event.error.stack ? event.error.stack : '';
                    if (isExtensionError(msg, filename, stack)) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  },
                  true
                );

                window.addEventListener(
                  'unhandledrejection',
                  function(event) {
                    var reason = event.reason;
                    var msg = reason && reason.message ? reason.message : '';
                    var stack = reason && reason.stack ? reason.stack : '';
                    if (isExtensionError(msg, '', stack)) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  },
                  true
                );
              })();
            `,
          }}
        />

        {/* Favicon and brand icons derived from official CampusPlay athletic emblem */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E40AF" />
        
        {/* Meta tags */}
        <meta name="description" content="CampusPlay - University Sports Grounds, Scheduling & Equipment System" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
