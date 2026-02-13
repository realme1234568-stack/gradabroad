"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserContextType {
  firstName: string | null;
  email: string | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  firstName: null,
  email: null,
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        // Try to get first name from user_metadata or user identities
        let name = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (!name && user.identities && user.identities.length > 0) {
          name = user.identities[0].identity_data?.full_name || user.identities[0].identity_data?.name || "";
        }
        let first = name.split(" ")[0] || null;
        setFirstName(first ? first.charAt(0).toUpperCase() + first.slice(1) : null);
        setEmail(user.email ?? null);
      } else {
        setFirstName(null);
        setEmail(null);
      }
      setLoading(false);
    }
    fetchUser();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ firstName, email, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
