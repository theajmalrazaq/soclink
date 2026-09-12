import { create } from "zustand";

const INITIAL_CREATE_FORM = {
  createTitle: "",
  createDate: undefined as Date | undefined,
  createHour: "",
  createMinute: "",
  createPeriod: "AM",
  createSpeaker: "",
  createLinkPrimary: "",
  createLinkSecondary: "",
  createLinkOneText: "",
  createLinkTwoText: "",
  createLocation: "",
  createImgUrl: "",
  createDescription: "",
  createIsCompetition: false,
  createSendEmail: false,
  createCustomRecipients: "",
  createSendingProgress: { current: 0, total: 0 },
};

const INITIAL_EDIT_FORM = {
  title: "",
  date: undefined as Date | string | undefined,
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
  isCompetition: false,
};

export interface EventsPageState {
  page: number;
  search: string;
  statusFilter: string;
  eventToDelete: any;
  selectedEvent: any;
  isCreateOpen: boolean;
  createStep: number;
  createLoading: boolean;

  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (filter: string) => void;
  setEventToDelete: (event: any) => void;
  setIsCreateOpen: (open: boolean) => void;
  setCreateStep: (step: number) => void;
  setCreateLoading: (loading: boolean) => void;

  editForm: typeof INITIAL_EDIT_FORM;
  setSelectedEvent: (event: any) => void;
  setEditFormField: (field: string, value: any) => void;
  setEditForm: (form: typeof INITIAL_EDIT_FORM) => void;
  resetEditForm: () => void;

  createForm: typeof INITIAL_CREATE_FORM;
  setCreateFormField: (field: string, value: any) => void;
  resetCreateForm: () => void;
}

export const useEventsPageStore = create<EventsPageState>((set) => ({
  page: 0,
  search: "",
  statusFilter: "all",
  eventToDelete: null,
  selectedEvent: null,
  isCreateOpen: false,
  createStep: 1,
  createLoading: false,

  setPage: (page) => set({ page }),
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setEventToDelete: (eventToDelete) => set({ eventToDelete }),
  setIsCreateOpen: (isCreateOpen) => set({ isCreateOpen }),
  setCreateStep: (createStep) => set({ createStep }),
  setCreateLoading: (createLoading) => set({ createLoading }),

  editForm: INITIAL_EDIT_FORM,
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setEditFormField: (field, value) =>
    set((state) => ({
      editForm: { ...state.editForm, [field]: value },
    })),
  setEditForm: (editForm) => set({ editForm }),
  resetEditForm: () => set({ selectedEvent: null, editForm: INITIAL_EDIT_FORM }),

  createForm: INITIAL_CREATE_FORM,
  setCreateFormField: (field, value) =>
    set((state) => ({
      createForm: { ...state.createForm, [field]: value },
    })),
  resetCreateForm: () =>
    set({
      createForm: INITIAL_CREATE_FORM,
      isCreateOpen: false,
      createStep: 1,
      createLoading: false,
    }),
}));
