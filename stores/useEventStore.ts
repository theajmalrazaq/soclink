import { create } from "zustand";

const INITIAL_EVENT_FORM = {
  title: "",
  date: undefined as Date | undefined,
  hour: "",
  minute: "",
  period: "AM",
  speaker: "",
  linkPrimary: "",
  linkSecondary: "",
  linkOneText: "",
  linkTwoText: "",
  location: "",
  imgUrl: "",
  description: "",
  iscompetition: false,
  sendEmail: false,
  customRecipients: "",
  sendingProgress: { current: 0, total: 0 },
};

const INITIAL_EDIT_FORM = {
  title: "",
  date: "",
  linkPrimary: "",
  linkSecondary: "",
  linkOneText: "",
  linkTwoText: "",
  speaker: "",
  location: "",
  imgUrl: "",
  description: "",
  isCompetition: false,
};

export interface EventState {
  eventForm: typeof INITIAL_EVENT_FORM;
  isDialogOpen: boolean;
  isSubmitting: boolean;
  isCreateOpen: boolean;
  createStep: number;

  setEventFormField: (field: string, value: any) => void;
  setIsDialogOpen: (open: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setIsCreateOpen: (open: boolean) => void;
  setCreateStep: (step: number) => void;
  resetEventForm: () => void;

  search: string;
  activeFilter: string;
  listPage: number;
  eventToDelete: any;

  setSearch: (search: string) => void;
  setActiveFilter: (filter: string) => void;
  setListPage: (page: number) => void;
  setEventToDelete: (event: any) => void;

  selectedEvent: any;
  editForm: typeof INITIAL_EDIT_FORM;

  setSelectedEvent: (event: any) => void;
  setEditFormField: (field: string, value: any) => void;
  resetEditForm: () => void;

  detailsPage: number;
  detailsSearch: string;
  statusFilter: string;
  teamFilter: string;
  winnerPosition: string;
  winnerName: string;
  winnerRollNo: string;
  winnerEmail: string;
  winnerImageUrl: string;
  isCertificateModalOpen: boolean;
  currentCertificate: any;
  processingEmailId: any;

  setDetailsPage: (page: number) => void;
  setDetailsSearch: (search: string) => void;
  setStatusFilter: (filter: string) => void;
  setTeamFilter: (filter: string) => void;
  setWinnerField: (field: string, value: any) => void;
  setIsCertificateModalOpen: (open: boolean) => void;
  setCurrentCertificate: (cert: any) => void;
  setProcessingEmailId: (id: any) => void;
}

export const useEventStore = create<EventState>((set) => ({
  eventForm: INITIAL_EVENT_FORM,
  isDialogOpen: false,
  isSubmitting: false,
  isCreateOpen: false,
  createStep: 1,

  setEventFormField: (field, value) =>
    set((state) => ({
      eventForm: { ...state.eventForm, [field]: value },
    })),
  setIsDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsCreateOpen: (isCreateOpen) => set({ isCreateOpen }),
  setCreateStep: (createStep) => set({ createStep }),
  resetEventForm: () =>
    set({
      eventForm: INITIAL_EVENT_FORM,
      isDialogOpen: false,
      isSubmitting: false,
      isCreateOpen: false,
      createStep: 1,
    }),

  search: "",
  activeFilter: "all",
  listPage: 0,
  eventToDelete: null,

  setSearch: (search) => set({ search }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setListPage: (listPage) => set({ listPage }),
  setEventToDelete: (eventToDelete) => set({ eventToDelete }),

  selectedEvent: null,
  editForm: INITIAL_EDIT_FORM,

  setSelectedEvent: (selectedEvent) =>
    set({
      selectedEvent,
      editForm: selectedEvent
        ? {
            title: selectedEvent.title || "",
            date: selectedEvent.date || "",
            linkPrimary: selectedEvent.link_primary || "",
            linkSecondary: selectedEvent.link_secondary || "",
            linkOneText: selectedEvent.linkone_text || "",
            linkTwoText: selectedEvent.linktwo_text || "",
            speaker: selectedEvent.speaker || "",
            location: selectedEvent.location || "",
            imgUrl: selectedEvent.img_url || "",
            description: selectedEvent.description || "",
            isCompetition: selectedEvent.is_competition || false,
          }
        : INITIAL_EDIT_FORM,
    }),
  setEditFormField: (field, value) =>
    set((state) => ({
      editForm: { ...state.editForm, [field]: value },
    })),
  resetEditForm: () => set({ selectedEvent: null, editForm: INITIAL_EDIT_FORM }),

  detailsPage: 0,
  detailsSearch: "",
  statusFilter: "all",
  teamFilter: "all",
  winnerPosition: "1",
  winnerName: "",
  winnerRollNo: "",
  winnerEmail: "",
  winnerImageUrl: "",
  isCertificateModalOpen: false,
  currentCertificate: null,
  processingEmailId: null,

  setDetailsPage: (detailsPage) => set({ detailsPage }),
  setDetailsSearch: (detailsSearch) => set({ detailsSearch, detailsPage: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, detailsPage: 0 }),
  setTeamFilter: (teamFilter) => set({ teamFilter, detailsPage: 0 }),
  setWinnerField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
    })),
  setIsCertificateModalOpen: (isCertificateModalOpen) => set({ isCertificateModalOpen }),
  setCurrentCertificate: (currentCertificate) => set({ currentCertificate }),
  setProcessingEmailId: (processingEmailId) => set({ processingEmailId }),
}));
