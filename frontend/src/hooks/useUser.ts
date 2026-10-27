import { useContext } from "react";

import { UserContext, type UserContextValue } from "@/lib/user-context";

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside <UserProvider>");
  return context;
}
