import { Navigate } from "react-router";
import { useProfileStore } from "@/stores/profileStore";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const profile = useProfileStore((state) => state.profile);
  if (!profile) return <Navigate to="/no-profile" replace />;
  return <>{children}</>;
}
