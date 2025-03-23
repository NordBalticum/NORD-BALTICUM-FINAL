// ✅ Global Styles – CSS hierarchy
import "@/styles/globals.css";
import "@/styles/theme.css";

// ✅ Contexts
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { BalanceProvider } from "@/contexts/BalanceContext";

// ✅ Head – Favicon, Metadata, Scaling, SEO
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* ✅ Responsive + Mobile Optimized Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="description" content="NordBalticum – Ultra Secure Web3 Bank" />
        <meta name="theme-color" content="#0A1F44" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />

        {/* ✅ App Title & Icon */}
        <title>NordBalticum</title>
        <link rel="icon" href="/icons/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/logo.png" />
      </Head>

      {/* ✅ Global Providers – Auth + Balance + Real-Time */}
      <MagicLinkProvider>
        <BalanceProvider>
          <Component {...pageProps} />
        </BalanceProvider>
      </MagicLinkProvider>
    </>
  );
}
