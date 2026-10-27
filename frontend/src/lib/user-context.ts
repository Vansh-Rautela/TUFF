import { createContext } from "react";

import type { ColorAnalysis, Profile, ProfileUpdate } from "@/types/api";

export interface UserContextValue {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;
  /** Create the anonymous profile on first need (onboarding, first like). */
  ensureUser: () => Promise<string>;
  updateProfile: (changes: ProfileUpdate) => Promise<Profile>;
  rememberAnalysis: (analysis: ColorAnalysis) => void;
  forget: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);
export const profileKey = (userId: string | null) => ["profile", userId] as const;

