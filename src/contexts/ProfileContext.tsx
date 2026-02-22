import { createContext, useState, useContext } from "react";
import Profile from "@/class/Profiles";
import type { ReactNode } from "react";

const STORAGE_KEY = "rud-profile";

function loadProfileFromStorage(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return Profile.fromJSON(JSON.parse(raw));
  } catch {
    return null;
  }
}

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<Profile | null>(loadProfileFromStorage);

  const setProfile = (profile: Profile | null) => {
    if (profile === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.toJSON()));
    }
    setProfileState(profile);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
};
