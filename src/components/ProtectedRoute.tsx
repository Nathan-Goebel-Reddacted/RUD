import { Navigate } from "react-router";
import { useProfile } from "@/contexts/ProfileContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  if (!profile) return <Navigate to="/no-profile" replace />;
  return <>{children}</>;
}
