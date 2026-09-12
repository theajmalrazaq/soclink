import { create } from "zustand";
import { getEmailConfig } from "@/lib/emailConfig";

const getInitialComposeForm = () => {
  const emailConfig = getEmailConfig();
  return {
    to: "",
    subject: emailConfig.brandName
      ? `Announcement from ${emailConfig.brandName}`
      : "New Announcement",
    message: "",
  };
};

export interface EmailState {
  searchTerm: string;
  statusFilter: string;
  exportFilter: string;
  page: number;
  responseToView: any;
  responseToReply: any;
  replyMessage: string;
  responseToDelete: any;

  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setExportFilter: (filter: string) => void;
  setPage: (page: number) => void;
  setResponseToView: (item: any) => void;
  setResponseToReply: (item: any) => void;
  setReplyMessage: (msg: string) => void;
  setResponseToDelete: (item: any) => void;
  resetReplyModal: () => void;

  composeForm: ReturnType<typeof getInitialComposeForm>;
  setComposeFormField: (field: string, value: any) => void;
  resetComposeForm: () => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  searchTerm: "",
  statusFilter: "all",
  exportFilter: "all",
  page: 0,
  responseToView: null,
  responseToReply: null,
  replyMessage: "",
  responseToDelete: null,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setPage: (page) => set({ page }),
  setResponseToView: (responseToView) => set({ responseToView }),
  setResponseToReply: (responseToReply) => set({ responseToReply }),
  setReplyMessage: (replyMessage) => set({ replyMessage }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),
  resetReplyModal: () => set({ responseToReply: null, replyMessage: "" }),

  composeForm: getInitialComposeForm(),
  setComposeFormField: (field, value) =>
    set((state) => ({
      composeForm: { ...state.composeForm, [field]: value },
    })),
  resetComposeForm: () => set({ composeForm: getInitialComposeForm() }),
}));
