import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import {
  api,
  ApiError,
  type CreateUserBody,
  type ServerUser,
  type UpdateUserBody,
} from "../api/client";
import type { DepartmentId } from "../types/types";
import type { RootState } from "./store";
import type { AppUser } from "./authSlice";

const BOOTSTRAP_USER_ID = "100001";

function adapt(u: ServerUser): AppUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    departments: u.departments,
  };
}

function requireUserId(state: RootState): string {
  const id = state.auth.currentUser?.id;
  if (!id) throw new Error("No current user");
  return id;
}

export const fetchUsers = createAsyncThunk<
  AppUser[],
  void,
  { state: RootState; rejectValue: string }
>("users/fetch", async (_, { getState, rejectWithValue }) => {
  const userId = getState().auth.currentUser?.id ?? BOOTSTRAP_USER_ID;
  try {
    const users = await api.listUsers(userId);
    return users.map(adapt);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export const createUserAsync = createAsyncThunk<
  AppUser,
  CreateUserBody,
  { state: RootState; rejectValue: string }
>("users/create", async (body, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const u = await api.createUser(userId, body);
    return adapt(u);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export const updateUserAsync = createAsyncThunk<
  AppUser,
  { id: string; changes: UpdateUserBody },
  { state: RootState; rejectValue: string }
>("users/update", async ({ id, changes }, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const u = await api.updateUser(userId, id, changes);
    return adapt(u);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export const deleteUserAsync = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("users/delete", async (id, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    await api.deleteUser(userId, id);
    return id;
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

interface UsersState {
  list: AppUser[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  mutationError: string | null;
}

const initialState: UsersState = {
  list: [],
  status: "idle",
  error: null,
  mutationError: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersMutationError: (state) => {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "ready";
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Error desconocido";
      })
      .addCase(createUserAsync.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
        else state.list.push(action.payload);
        state.list.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createUserAsync.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Error al crear usuario";
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Error al actualizar usuario";
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Error al eliminar usuario";
      });
  },
});

export const { clearUsersMutationError } = usersSlice.actions;
export default usersSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
const selectUsers = (s: RootState) => s.users.list;

export const selectUserById = (id: string) =>
  createSelector(selectUsers, (users) => users.find((u) => u.id === id));

export const selectUserByName = (name: string) =>
  createSelector(selectUsers, (users) => users.find((u) => u.name === name));

export const selectUsersByDepartment = (departmentId: DepartmentId) =>
  createSelector(selectUsers, (users) =>
    users.filter((u) => u.departments.some((d) => d.departmentId === departmentId)),
  );
