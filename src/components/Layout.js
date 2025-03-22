import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();
  const isIndex = router.pathname === "/";

  return (
    <>
      {!isIndex && <Navbar />}
      <main>{children}</main>
    </>
  );
}
