import { create } from "zustand";
import { getEmailConfig } from "@/lib/emailConfig";

const INITIAL_SOCIETY_DATA = {
  id: null,
  name: "",
  username: "",
  email: "",
  adminName: "",
  logoUrl: "",
  coverUrl: "",
  brandingColor: "#2A43F8",
  instagramUrl: "",
  linkedinUrl: "",
};

const INITIAL_SMTP_DATA = {
  user: "",
  pass: "",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  fromName: "",
};

export interface EmailSettingsState {
  activeSection: string;
  formData: any;
  selectedTemplate: string;
  viewMode: string;
  previewHtml: string;
  previewLoading: boolean;
  isSaving: boolean;
  isSavingSociety: boolean;
  resetDialogOpen: boolean;
  testDialogOpen: boolean;
  testEmailAddress: string;
  sendingTest: boolean;
  societyData: typeof INITIAL_SOCIETY_DATA;
  smtpData: typeof INITIAL_SMTP_DATA;
  showSmtpPassword: boolean;
  testingSmtp: boolean;

  setActiveSection: (section: string) => void;
  setFormData: (dataOrFn: any) => void;
  setFormField: (field: string, value: any) => void;
  setSelectedTemplate: (template: string) => void;
  setViewMode: (mode: string) => void;
  setPreviewHtml: (html: string) => void;
  setPreviewLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsSavingSociety: (saving: boolean) => void;
  setResetDialogOpen: (open: boolean) => void;
  setTestDialogOpen: (open: boolean) => void;
  setTestEmailAddress: (email: string) => void;
  setSendingTest: (sending: boolean) => void;
  setSocietyData: (dataOrFn: any) => void;
  setSocietyField: (field: string, value: any) => void;
  setSmtpData: (dataOrFn: any) => void;
  setSmtpField: (field: string, value: any) => void;
  setShowSmtpPassword: (show: boolean | ((prev: boolean) => boolean)) => void;
  setTestingSmtp: (testing: boolean) => void;
}

export const useEmailSettingsStore = create<EmailSettingsState>((set) => ({
  activeSection: "society_profile",
  formData: getEmailConfig(),
  selectedTemplate: "announcement",
  viewMode: "desktop",
  previewHtml: "",
  previewLoading: false,
  isSaving: false,
  isSavingSociety: false,
  resetDialogOpen: false,
  testDialogOpen: false,
  testEmailAddress: "",
  sendingTest: false,
  societyData: INITIAL_SOCIETY_DATA,
  smtpData: INITIAL_SMTP_DATA,
  showSmtpPassword: false,
  testingSmtp: false,

  setActiveSection: (activeSection) => set({ activeSection }),
  setFormData: (formDataOrFn) =>
    set((state) => ({
      formData: typeof formDataOrFn === "function" ? formDataOrFn(state.formData) : formDataOrFn,
    })),
  setFormField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPreviewHtml: (previewHtml) => set({ previewHtml }),
  setPreviewLoading: (previewLoading) => set({ previewLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsSavingSociety: (isSavingSociety) => set({ isSavingSociety }),
  setResetDialogOpen: (resetDialogOpen) => set({ resetDialogOpen }),
  setTestDialogOpen: (testDialogOpen) => set({ testDialogOpen }),
  setTestEmailAddress: (testEmailAddress) => set({ testEmailAddress }),
  setSendingTest: (sendingTest) => set({ sendingTest }),
  setSocietyData: (societyDataOrFn) =>
    set((state) => ({
      societyData:
        typeof societyDataOrFn === "function"
          ? societyDataOrFn(state.societyData)
          : societyDataOrFn,
    })),
  setSocietyField: (field, value) =>
    set((state) => ({
      societyData: { ...state.societyData, [field]: value },
    })),
  setSmtpData: (smtpDataOrFn) =>
    set((state) => ({
      smtpData: typeof smtpDataOrFn === "function" ? smtpDataOrFn(state.smtpData) : smtpDataOrFn,
    })),
  setSmtpField: (field, value) =>
    set((state) => ({
      smtpData: { ...state.smtpData, [field]: value },
    })),
  setShowSmtpPassword: (showOrFn) =>
    set((state) => ({
      showSmtpPassword:
        typeof showOrFn === "function" ? showOrFn(state.showSmtpPassword) : showOrFn,
    })),
  setTestingSmtp: (testingSmtp) => set({ testingSmtp }),
}));
