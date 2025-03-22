import NavBar from "./NavBar";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();
  const isIndex = router.pathname === "/";

  return (
    <>
      {!isIndex && <NavBar />}
      <main>{children}</main>
    </>
  );
}
