import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import QRCode from "react-qr-code";

export default function Receive() {
  const { user } = useMagicLink();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
  }, [user]);

  if (!user) return null;

  const dummyAddress = "0x1234...ABCD"; // Pakeisi vėliau į realų

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Your Wallet Address</h1>
      <QRCode value={dummyAddress} />
      <p style={{ marginTop: "1rem" }}>{dummyAddress}</p>
    </div>
  );
}
