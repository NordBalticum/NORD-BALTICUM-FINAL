import { useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { user, signInWithEmail } = useMagicLink();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmail(email);
      setMessage("Check your email for the magic link!");
    } catch (error) {
      setMessage("Login error: " + error.message);
    }
  };

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "100px auto" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />
        <button type="submit" style={{ padding: "10px", width: "100%" }}>
          Send Magic Link
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
}
