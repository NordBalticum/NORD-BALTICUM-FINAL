import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Send() {
  const { user } = useMagicLink();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Send Crypto (Coming soon)</h1>
    </div>
  );
}
