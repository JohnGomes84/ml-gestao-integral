import { useState } from "react";

type User = {
  id: number;
  name?: string | null;
  email?: string | null;
};

export function useAuth() {
  const [user] = useState<User | null>(null);

  return {
    loading: false,
    user,
    logout: async () => {
      if (typeof window !== "undefined") {
        window.location.href = "/api/trpc/auth.logout";
      }
    },
  };
}
