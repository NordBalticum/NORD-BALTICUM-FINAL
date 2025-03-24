import "@/styles/globals.css";
import "@/styles/theme.css";
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { BalanceProviderEthers } from "@/contexts/BalanceProviderEthers";
import Layout from "@/components/Layout";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>NordBalticum</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0A1F44" />
        <link rel="icon" href="/icons/logo.png" />
      </Head>

      <MagicLinkProvider>
        <BalanceProviderEthers>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </BalanceProviderEthers>
      </MagicLinkProvider>
    </>
  );
}
