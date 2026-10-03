// src/components/layout/user-context.tsx
"use client";

import { createContext, useContext } from "react";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}