import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  DepartmentId,
  CategoryId,
} from "../types/types";
import {
  api,
  ApiError,
  type ServerTicket,
  type UpdateTicketBody,
} from "../api/client";
import type { RootState } from "./store";

function adaptServerTicket(t: ServerTicket): Ticket {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    note: t.note ?? undefined,
    departmentId: t.departmentId,
    categoryId: t.categoryId,
    status: t.status,
    priority: t.priority,
    createdBy: t.createdBy?.name ?? t.createdById,
    assignedTo: t.assignedTo?.name ?? undefined,
    executionDate: t.executionDate ?? undefined,
    executionTime: t.executionTime ?? undefined,
    payload: t.payload ?? undefined,
    payloadVersion: t.payloadVersion,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function requireUserId(state: RootState): string {
  const id = state.auth.currentUser?.id;
  if (!id) throw new Error("No current user");
  return id;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTickets = createAsyncThunk<
  Ticket[],
  void,
  { state: RootState; rejectValue: string }
>("tickets/fetch", async (_, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const list = await api.listTickets(userId, { take: 100 });
    return list.items.map(adaptServerTicket);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

/** Detail fetch — list endpoint omits payloads for perf, so we re-fetch to hydrate them. */
export const fetchTicketDetailAsync = createAsyncThunk<
  Ticket,
  string,
  { state: RootState; rejectValue: string }
>("tickets/fetchDetail", async (id, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const server = await api.getTicket(userId, id);
    return adaptServerTicket(server);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export const createTicketAsync = createAsyncThunk<
  Ticket,
  {
    title: string;
    description: string;
    note?: string;
    departmentId: DepartmentId;
    categoryId: CategoryId;
    priority: TicketPriority;
    assignedToId?: string;
    executionDate?: string;
    executionTime?: string;
    payload?: unknown;
  },
  { state: RootState; rejectValue: string }
>("tickets/create", async (input, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const server = await api.createTicket(userId, {
      title: input.title,
      description: input.description || undefined,
      note: input.note || undefined,
      departmentId: input.departmentId,
      categoryId: input.categoryId,
      priority: input.priority,
      assignedToId: input.assignedToId || undefined,
      executionDate: input.executionDate || undefined,
      executionTime: input.executionTime || undefined,
      payload: input.payload,
    });
    return adaptServerTicket(server);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export type UpdateTicketChanges = {
  title?: string;
  description?: string;
  note?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
  executionDate?: string | null;
  executionTime?: string | null;
  payload?: unknown;
};

export const updateTicketAsync = createAsyncThunk<
  Ticket,
  { id: string; changes: UpdateTicketChanges },
  { state: RootState; rejectValue: string }
>("tickets/update", async ({ id, changes }, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    const body: UpdateTicketBody = {};
    if (changes.title !== undefined) body.title = changes.title;
    if (changes.description !== undefined) body.description = changes.description;
    if (changes.note !== undefined) body.note = changes.note;
    if (changes.status !== undefined) body.status = changes.status;
    if (changes.priority !== undefined) body.priority = changes.priority;
    if (changes.assignedToId !== undefined) body.assignedToId = changes.assignedToId;
    if (changes.executionDate !== undefined) body.executionDate = changes.executionDate;
    if (changes.executionTime !== undefined) body.executionTime = changes.executionTime;
    if (changes.payload !== undefined) body.payload = changes.payload;

    const server = await api.updateTicket(userId, id, body);
    return adaptServerTicket(server);
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

export const deleteTicketAsync = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("tickets/delete", async (id, { getState, rejectWithValue }) => {
  try {
    const userId = requireUserId(getState());
    await api.deleteTicket(userId, id);
    return id;
  } catch (e) {
    return rejectWithValue(e instanceof ApiError ? e.message : "Network error");
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

interface TicketsState {
  tickets: Ticket[];
  status: "idle" | "loading" | "ready" | "error";
  fetchError: string | null;
  creating: boolean;
  createError: string | null;
  mutationError: string | null;
}

const initialState: TicketsState = {
  tickets: [],
  status: "idle",
  fetchError: null,
  creating: false,
  createError: null,
  mutationError: null,
};

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearMutationError: (state) => {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTickets.pending, (state) => {
        state.status = "loading";
        state.fetchError = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.status = "ready";
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.status = "error";
        state.fetchError = action.payload ?? "Error desconocido";
      })
      // create
      .addCase(createTicketAsync.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createTicketAsync.fulfilled, (state, action) => {
        state.creating = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicketAsync.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "Error desconocido";
      })
      // detail
      .addCase(fetchTicketDetailAsync.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) state.tickets[idx] = action.payload;
        else state.tickets.unshift(action.payload);
      })
      // update
      .addCase(updateTicketAsync.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) state.tickets[idx] = action.payload;
      })
      .addCase(updateTicketAsync.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Error al actualizar";
      })
      // delete
      .addCase(deleteTicketAsync.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTicketAsync.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Error al eliminar";
      });
  },
});

export const { clearCreateError, clearMutationError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
