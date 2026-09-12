import { create } from "zustand";

const INITIAL_INTERVIEW_DATA = {
  date: undefined as Date | undefined,
  startTime: "",
  endTime: "",
  interviewType: "online",
  meetingLink: "",
  room: "",
  instructions: "",
};

const INITIAL_BULK_INTERVIEW_DATA = {
  date: undefined as Date | undefined,
  startTime: "",
  endTime: "",
  interviewType: "online",
  meetingLink: "",
  room: "",
  cc: "",
};

export interface InductionState {
  searchTerm: string;
  statusFilter: string;
  teamFilter: string;
  exportFilter: string;
  page: number;
  responseToView: any;
  responseToDelete: any;

  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setTeamFilter: (filter: string) => void;
  setExportFilter: (filter: string) => void;
  setPage: (page: number) => void;
  setResponseToView: (item: any) => void;
  setResponseToDelete: (item: any) => void;

  isInterviewDialogOpen: boolean;
  interviewCandidate: any;
  interviewData: typeof INITIAL_INTERVIEW_DATA;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  endHour: string;
  endMinute: string;
  endPeriod: string;

  setStartHour: (hour: string) => void;
  setStartMinute: (minute: string) => void;
  setStartPeriod: (period: string) => void;
  setEndHour: (hour: string) => void;
  setEndMinute: (minute: string) => void;
  setEndPeriod: (period: string) => void;

  setIsInterviewDialogOpen: (open: boolean) => void;
  setInterviewCandidate: (candidate: any) => void;
  setInterviewData: (data: any) => void;
  setInterviewField: (field: string, value: any) => void;
  setSingleTimeField: (field: string, value: any) => void;

  isBulkInterviewDialogOpen: boolean;
  bulkInterviewData: typeof INITIAL_BULK_INTERVIEW_DATA;
  bulkStartHour: string;
  bulkStartMinute: string;
  bulkStartPeriod: string;
  bulkEndHour: string;
  bulkEndMinute: string;
  bulkEndPeriod: string;

  setBulkStartHour: (hour: string) => void;
  setBulkStartMinute: (minute: string) => void;
  setBulkStartPeriod: (period: string) => void;
  setBulkEndHour: (hour: string) => void;
  setBulkEndMinute: (minute: string) => void;
  setBulkEndPeriod: (period: string) => void;

  bulkProgress: { current: number; total: number };
  bulkResults: { success: any[]; failed: any[] };
  bulkTarget: string;
  bulkTargetCount: number;
  isBulkProgressDialogOpen: boolean;
  bulkActionTitle: string;

  setIsBulkInterviewDialogOpen: (open: boolean) => void;
  setBulkInterviewData: (data: any) => void;
  setBulkInterviewField: (field: string, value: any) => void;
  setBulkTimeField: (field: string, value: any) => void;
  setBulkProgress: (prog: { current: number; total: number }) => void;
  setBulkResults: (res: { success: any[]; failed: any[] }) => void;
  setBulkTarget: (target: string) => void;
  setBulkTargetCount: (count: number) => void;
  setIsBulkProgressDialogOpen: (open: boolean) => void;
  setBulkActionTitle: (title: string) => void;

  isAnnouncementDialogOpen: boolean;
  announcementData: { title: string; message: string };
  singleAnnouncementRecipient: any;

  setIsAnnouncementDialogOpen: (open: boolean) => void;
  setAnnouncementData: (data: { title: string; message: string }) => void;
  setSingleAnnouncementRecipient: (recipient: any) => void;
}

export const useInductionStore = create<InductionState>((set) => ({
  searchTerm: "",
  statusFilter: "all",
  teamFilter: "all",
  exportFilter: "all",
  page: 0,
  responseToView: null,
  responseToDelete: null,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setTeamFilter: (teamFilter) => set({ teamFilter, page: 0 }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setPage: (page) => set({ page }),
  setResponseToView: (responseToView) => set({ responseToView }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),

  isInterviewDialogOpen: false,
  interviewCandidate: null,
  interviewData: INITIAL_INTERVIEW_DATA,
  startHour: "",
  startMinute: "",
  startPeriod: "AM",
  endHour: "",
  endMinute: "",
  endPeriod: "AM",

  setIsInterviewDialogOpen: (isInterviewDialogOpen) => set({ isInterviewDialogOpen }),
  setInterviewCandidate: (interviewCandidate) => set({ interviewCandidate }),
  setInterviewData: (interviewData) => set({ interviewData }),
  setInterviewField: (field, value) =>
    set((state) => ({
      interviewData: { ...state.interviewData, [field]: value },
    })),
  setStartHour: (startHour) => set({ startHour }),
  setStartMinute: (startMinute) => set({ startMinute }),
  setStartPeriod: (startPeriod) => set({ startPeriod }),
  setEndHour: (endHour) => set({ endHour }),
  setEndMinute: (endMinute) => set({ endMinute }),
  setEndPeriod: (endPeriod) => set({ endPeriod }),
  setSingleTimeField: (field, value) => set((state) => ({ ...state, [field]: value })),

  isBulkInterviewDialogOpen: false,
  bulkInterviewData: INITIAL_BULK_INTERVIEW_DATA,
  bulkStartHour: "",
  bulkStartMinute: "",
  bulkStartPeriod: "AM",
  bulkEndHour: "",
  bulkEndMinute: "",
  bulkEndPeriod: "AM",

  setBulkStartHour: (bulkStartHour) => set({ bulkStartHour }),
  setBulkStartMinute: (bulkStartMinute) => set({ bulkStartMinute }),
  setBulkStartPeriod: (bulkStartPeriod) => set({ bulkStartPeriod }),
  setBulkEndHour: (bulkEndHour) => set({ bulkEndHour }),
  setBulkEndMinute: (bulkEndMinute) => set({ bulkEndMinute }),
  setBulkEndPeriod: (bulkEndPeriod) => set({ bulkEndPeriod }),

  bulkProgress: { current: 0, total: 0 },
  bulkResults: { success: [], failed: [] },
  bulkTarget: "waiting",
  bulkTargetCount: 0,
  isBulkProgressDialogOpen: false,
  bulkActionTitle: "",

  setIsBulkInterviewDialogOpen: (isBulkInterviewDialogOpen) => set({ isBulkInterviewDialogOpen }),
  setBulkInterviewData: (bulkInterviewData) => set({ bulkInterviewData }),
  setBulkInterviewField: (field, value) =>
    set((state) => ({
      bulkInterviewData: { ...state.bulkInterviewData, [field]: value },
    })),
  setBulkTimeField: (field, value) => set((state) => ({ ...state, [field]: value })),
  setBulkProgress: (bulkProgress) => set({ bulkProgress }),
  setBulkResults: (bulkResults) => set({ bulkResults }),
  setBulkTarget: (bulkTarget) => set({ bulkTarget }),
  setBulkTargetCount: (bulkTargetCount) => set({ bulkTargetCount }),
  setIsBulkProgressDialogOpen: (isBulkProgressDialogOpen) => set({ isBulkProgressDialogOpen }),
  setBulkActionTitle: (bulkActionTitle) => set({ bulkActionTitle }),

  isAnnouncementDialogOpen: false,
  announcementData: { title: "", message: "" },
  singleAnnouncementRecipient: null,

  setIsAnnouncementDialogOpen: (isAnnouncementDialogOpen) => set({ isAnnouncementDialogOpen }),
  setAnnouncementData: (announcementData) => set({ announcementData }),
  setSingleAnnouncementRecipient: (singleAnnouncementRecipient) =>
    set({ singleAnnouncementRecipient }),
}));
