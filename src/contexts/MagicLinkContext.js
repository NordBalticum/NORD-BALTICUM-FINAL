import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stebi auth būseną ir nustato user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        if (router.pathname === "/") router.push("/dashboard");
      } else {
        setUser(null);
        if (router.pathname !== "/") router.push("/");
      }
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (router.pathname === "/") router.push("/dashboard");
      } else {
        setUser(null);
        router.push("/");
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  // Magic Link login
  const loginWithEmail = async (email) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) console.error("MagicLink login error:", error.message);
    setLoading(false);
  };

  // Google login
  const loginWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) console.error("Google login error:", error.message);
    setLoading(false);
  };

  // Atsijungimas
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <MagicLinkContext.Provider value={{ user, loginWithEmail, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
