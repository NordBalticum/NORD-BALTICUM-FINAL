import "@styles/globals.css";
import "@styles/theme.css";
import Layout from "@components/Layout";
import { MagicLinkProvider } from "@contexts/MagicLinkContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MagicLinkProvider>
  );
}
