import { create } from "zustand";

const INITIAL_MEMBER_FORM = {
  name: "",
  roll_no: "",
  nu_email: "",
  whatsapp_no: "",
  designation: "",
  linkedin: "",
  avatar: "",
};

export interface LeadState {
  listPage: number;
  listSearch: string;
  selectedLead: any;
  editLeadTitle: string;
  leadCategoryToDelete: any;
  newLeadCategoryTitle: string;
  isCreatingNewLead: boolean;

  setListPage: (page: number) => void;
  setListSearch: (search: string) => void;
  setSelectedLead: (lead: any) => void;
  setEditLeadTitle: (title: string) => void;
  setLeadCategoryToDelete: (lead: any) => void;
  setNewLeadCategoryTitle: (title: string) => void;
  setIsCreatingNewLead: (creating: boolean) => void;
  resetLeadCategoryForm: () => void;

  searchTerm: string;
  page: number;
  exportFilter: string;
  leadToDelete: any;
  isCreatingNewMember: boolean;
  isUpdating: boolean;
  idToUpdate: any;
  memberForm: typeof INITIAL_MEMBER_FORM;

  setSearchTerm: (term: string) => void;
  setPage: (page: number) => void;
  setExportFilter: (filter: string) => void;
  setLeadToDelete: (item: any) => void;
  setIsCreatingNewMember: (creating: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
  setIdToUpdate: (item: any) => void;
  setMemberFormField: (field: string, value: any) => void;
  resetMemberForm: () => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  listPage: 0,
  listSearch: "",
  selectedLead: null,
  editLeadTitle: "",
  leadCategoryToDelete: null,
  newLeadCategoryTitle: "",
  isCreatingNewLead: false,

  setListPage: (listPage) => set({ listPage }),
  setListSearch: (listSearch) => set({ listSearch, listPage: 0 }),
  setSelectedLead: (selectedLead) =>
    set({
      selectedLead,
      editLeadTitle: selectedLead?.title || "",
    }),
  setEditLeadTitle: (editLeadTitle) => set({ editLeadTitle }),
  setLeadCategoryToDelete: (leadCategoryToDelete) => set({ leadCategoryToDelete }),
  setNewLeadCategoryTitle: (newLeadCategoryTitle) => set({ newLeadCategoryTitle }),
  setIsCreatingNewLead: (isCreatingNewLead) => set({ isCreatingNewLead }),
  resetLeadCategoryForm: () =>
    set({
      selectedLead: null,
      editLeadTitle: "",
      leadCategoryToDelete: null,
      newLeadCategoryTitle: "",
      isCreatingNewLead: false,
    }),

  searchTerm: "",
  page: 0,
  exportFilter: "all",
  leadToDelete: null,
  isCreatingNewMember: false,
  isUpdating: false,
  idToUpdate: null,
  memberForm: INITIAL_MEMBER_FORM,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setPage: (page) => set({ page }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setLeadToDelete: (leadToDelete) => set({ leadToDelete }),
  setIsCreatingNewMember: (isCreatingNewMember) => set({ isCreatingNewMember }),
  setIsUpdating: (isUpdating) => set({ isUpdating }),
  setIdToUpdate: (idToUpdate) =>
    set({
      idToUpdate,
      memberForm: idToUpdate
        ? {
            name: idToUpdate.name || "",
            roll_no: idToUpdate.roll_no || "",
            nu_email: idToUpdate.nu_email || "",
            whatsapp_no: idToUpdate.whatsapp_no || "",
            designation: idToUpdate.designation || "",
            linkedin: idToUpdate.linkedin || "",
            avatar: idToUpdate.avatar || "",
          }
        : INITIAL_MEMBER_FORM,
    }),
  setMemberFormField: (field, value) =>
    set((state) => ({
      memberForm: { ...state.memberForm, [field]: value },
    })),
  resetMemberForm: () =>
    set({
      memberForm: INITIAL_MEMBER_FORM,
      idToUpdate: null,
      isUpdating: false,
      isCreatingNewMember: false,
    }),
}));
