import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import type { AppUser } from "./authSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

/** Use inside the authenticated tree — assumes the bootstrap has populated currentUser. */
export function useCurrentUser(): AppUser {
  const user = useAppSelector((s) => s.auth.currentUser);
  if (!user) {
    throw new Error("useCurrentUser called before bootstrap completed");
  }
  return user;
}

/**
 * Returns true if the current user has ALL of the given permission codes.
 * master role always returns true regardless of codes.
 */
export function usePermission(...codes: string[]): boolean {
  const user = useAppSelector((s) => s.auth.currentUser);
  if (!user) return false;
  if (user.role === "master") return true;
  const perms = user.permissions ?? [];
  return codes.every((code) => perms.includes(code));
}
