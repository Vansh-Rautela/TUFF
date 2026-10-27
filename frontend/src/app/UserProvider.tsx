import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";
import { storeUserId, storedUserId } from "@/lib/session";
import { UserContext, profileKey, type UserContextValue } from "@/lib/user-context";
import type { ColorAnalysis, Profile, ProfileUpdate } from "@/types/api";

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(storedUserId);

  const profileQuery = useQuery({
    queryKey: profileKey(userId),
    queryFn: async () => {
      try {
        return await api.profile(userId!);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          storeUserId(null); // the server no longer knows this id (e.g. data deleted)
          setUserId(null);
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const ensureUser = useCallback(async () => {
    if (userId) return userId;
    const { id } = await api.createUser();
    storeUserId(id);
    setUserId(id);
    return id;
  }, [userId]);

  const update = useMutation({
    mutationFn: async (changes: ProfileUpdate) => api.updateProfile(await ensureUser(), changes),
    onSuccess: (profile) => queryClient.setQueryData(profileKey(storedUserId()), profile),
  });

  const rememberAnalysis = useCallback(
    (analysis: ColorAnalysis) => {
      queryClient.setQueryData<Profile | null>(profileKey(storedUserId()), (current) =>
        current ? { ...current, color_analysis: analysis, season: analysis.season.name, onboarded: true } : current,
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    [queryClient],
  );

  const forget = useCallback(async () => {
    if (userId) await api.deleteUser(userId);
    storeUserId(null);
    setUserId(null);
    queryClient.clear();
  }, [queryClient, userId]);

  const value = useMemo<UserContextValue>(
    () => ({
      userId,
      profile: profileQuery.data ?? null,
      isLoading: Boolean(userId) && profileQuery.isLoading,
      ensureUser,
      updateProfile: update.mutateAsync,
      rememberAnalysis,
      forget,
    }),
    [userId, profileQuery.data, profileQuery.isLoading, ensureUser, update.mutateAsync, rememberAnalysis, forget],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

