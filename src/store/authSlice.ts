import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DepartmentId } from "../types/types";

export type UserRole = "master" | "admin" | "user";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  departments: DepartmentId[];
}

interface AuthState {
  currentUser: AppUser | null;
}

const initialState: AuthState = {
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<AppUser | null>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setCurrentUser } = authSlice.actions;
export default authSlice.reducer;
