// ✅ Global Styles
import "@/styles/globals.css";
import "@/styles/theme.css";

// ✅ Context
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";

// ✅ Head (favicon, metadata jei norėsi vėliau naudoti)
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NordBalticum</title>
        <link rel="icon" href="/icons/logo.png" />
      </Head>

      <MagicLinkProvider>
        <Component {...pageProps} />
      </MagicLinkProvider>
    </>
  );
}
