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
