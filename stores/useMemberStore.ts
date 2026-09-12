import { create } from "zustand";

export interface MemberState {
  searchTerm: string;
  statusFilter: string;
  teamFilter: string;
  page: number;
  exportFilter: string;
  responseToView: any;
  responseToDelete: any;

  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setTeamFilter: (filter: string) => void;
  setPage: (page: number) => void;
  setExportFilter: (filter: string) => void;
  setResponseToView: (item: any) => void;
  setResponseToDelete: (item: any) => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  searchTerm: "",
  statusFilter: "all",
  teamFilter: "all",
  page: 0,
  exportFilter: "all",
  responseToView: null,
  responseToDelete: null,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setTeamFilter: (teamFilter) => set({ teamFilter, page: 0 }),
  setPage: (page) => set({ page }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setResponseToView: (responseToView) =>
    set((state) => ({
      responseToView:
        typeof responseToView === "function"
          ? responseToView(state.responseToView)
          : responseToView,
    })),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),
}));
