import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Profile from "@/class/Profiles";

type ProfileState = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: "rud-profile",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.profile && !(state.profile instanceof Profile)) {
          state.profile = Profile.fromJSON(state.profile) ?? null;
        }
      },
    }
  )
);
