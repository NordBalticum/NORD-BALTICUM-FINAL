import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, signOut } = useMagicLink();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut} style={{ marginTop: "1rem", padding: "10px" }}>
        Sign Out
      </button>
    </div>
  );
}
