import { create } from "zustand";

export interface EventDetailsState {
  page: number;
  searchTerm: string;
  statusFilter: string;
  attendanceFilter: string;
  responseToDelete: any;
  isWinnerDialogOpen: boolean;
  selectedWinner: any;
  winnerPosition: any;
  winnerImageUrl: string;
  processingEmailId: any;
  currentCertificate: any;

  setPage: (page: number) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setAttendanceFilter: (filter: string) => void;
  setResponseToDelete: (item: any) => void;
  setIsWinnerDialogOpen: (open: boolean) => void;
  setSelectedWinner: (winner: any) => void;
  setWinnerPosition: (position: any) => void;
  setWinnerImageUrl: (url: string) => void;
  setProcessingEmailId: (id: any) => void;
  setCurrentCertificate: (cert: any) => void;
  resetWinnerDialog: () => void;
}

export const useEventDetailsStore = create<EventDetailsState>((set) => ({
  page: 0,
  searchTerm: "",
  statusFilter: "all",
  attendanceFilter: "all",
  responseToDelete: null,
  isWinnerDialogOpen: false,
  selectedWinner: null,
  winnerPosition: null,
  winnerImageUrl: "",
  processingEmailId: null,
  currentCertificate: null,

  setPage: (page) => set({ page }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setAttendanceFilter: (attendanceFilter) => set({ attendanceFilter, page: 0 }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),
  setIsWinnerDialogOpen: (isWinnerDialogOpen) => set({ isWinnerDialogOpen }),
  setSelectedWinner: (selectedWinner) => set({ selectedWinner }),
  setWinnerPosition: (winnerPosition) => set({ winnerPosition }),
  setWinnerImageUrl: (winnerImageUrl) => set({ winnerImageUrl }),
  setProcessingEmailId: (processingEmailId) => set({ processingEmailId }),
  setCurrentCertificate: (currentCertificate) => set({ currentCertificate }),
  resetWinnerDialog: () =>
    set({
      isWinnerDialogOpen: false,
      selectedWinner: null,
      winnerPosition: null,
      winnerImageUrl: "",
    }),
}));
