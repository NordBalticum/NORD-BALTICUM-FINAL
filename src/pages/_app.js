// ✅ Global Styles
import "@/styles/globals.css";
import "@/styles/theme.css";

// ✅ Contexts
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { BalanceProvider } from "@/contexts/BalanceContext";

// ✅ Head (favicon, metadata, scaling)
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <title>NordBalticum</title>
        <link rel="icon" href="/icons/logo.png" />
      </Head>

      {/* ✅ Contexts */}
      <MagicLinkProvider>
        <BalanceProvider>
          <Component {...pageProps} />
        </BalanceProvider>
      </MagicLinkProvider>
    </>
  );
}
