// ✅ Global Styles – CSS hierarchy
import "@/styles/globals.css";
import "@/styles/theme.css";

// ✅ Contexts
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { BalanceProviderEthers } from "@/contexts/BalanceProviderEthers";

// ✅ UI Components
import Navbar from "@/components/Navbar";

// ✅ Head – Favicon, Metadata, Scaling, SEO
import Head from "next/head";
import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const hideNavbarRoutes = ["/"]; // tiksliai pasakyk kokius puslapius rodyti be navbar jei bus daugiau

  const showNavbar = !hideNavbarRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="description" content="NordBalticum – Ultra Secure Web3 Bank" />
        <meta name="theme-color" content="#0A1F44" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <title>NordBalticum</title>
        <link rel="icon" href="/icons/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/logo.png" />
      </Head>

      {/* ✅ Global Context Wrappers */}
      <MagicLinkProvider>
        <BalanceProviderEthers>
          {/* ✅ Show Navbar everywhere except specific routes */}
          {showNavbar && <Navbar />}

          {/* ✅ Fullscreen Layout Wrap */}
          <main style={{ paddingTop: showNavbar ? "clamp(68px, 7.5vh, 96px)" : 0 }}>
            <Component {...pageProps} />
          </main>
        </BalanceProviderEthers>
      </MagicLinkProvider>
    </>
  );
}
