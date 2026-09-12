import { create } from "zustand";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

const INITIAL_NEW_USER = {
  name: "",
  email: "",
  password: "",
  role: "Member",
};

export interface UserState {
  search: string;
  roleFilter: string;
  isCreateOpen: boolean;
  createStep: number;
  newUser: typeof INITIAL_NEW_USER;
  permissionMatrix: any;
  editingUser: any;
  editPermissions: any;
  deletingUser: any;

  setSearch: (search: string) => void;
  setRoleFilter: (filter: string) => void;
  setIsCreateOpen: (open: boolean) => void;
  setCreateStep: (step: number) => void;
  setNewUser: (user: typeof INITIAL_NEW_USER) => void;
  setNewUserField: (field: string, value: any) => void;
  setPermissionMatrix: (matrixOrFn: any) => void;
  setEditingUser: (user: any) => void;
  setEditingUserField: (field: string, value: any) => void;
  setEditPermissions: (permOrFn: any) => void;
  setDeletingUser: (user: any) => void;
  resetCreateModal: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  search: "",
  roleFilter: "all",
  isCreateOpen: false,
  createStep: 1,
  newUser: INITIAL_NEW_USER,
  permissionMatrix: DEFAULT_PERMISSIONS,
  editingUser: null,
  editPermissions: DEFAULT_PERMISSIONS,
  deletingUser: null,

  setSearch: (search) => set({ search }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setIsCreateOpen: (isCreateOpen) => set({ isCreateOpen }),
  setCreateStep: (createStep) => set({ createStep }),
  setNewUser: (newUser) => set({ newUser }),
  setNewUserField: (field, value) =>
    set((state) => ({
      newUser: { ...state.newUser, [field]: value },
    })),
  setPermissionMatrix: (permissionMatrixOrFn) =>
    set((state) => ({
      permissionMatrix:
        typeof permissionMatrixOrFn === "function"
          ? permissionMatrixOrFn(state.permissionMatrix)
          : permissionMatrixOrFn,
    })),
  setEditingUser: (editingUser) => set({ editingUser }),
  setEditingUserField: (field, value) =>
    set((state) => ({
      editingUser: state.editingUser ? { ...state.editingUser, [field]: value } : null,
    })),
  setEditPermissions: (editPermissionsOrFn) =>
    set((state) => ({
      editPermissions:
        typeof editPermissionsOrFn === "function"
          ? editPermissionsOrFn(state.editPermissions)
          : editPermissionsOrFn,
    })),
  setDeletingUser: (deletingUser) => set({ deletingUser }),
  resetCreateModal: () =>
    set({
      isCreateOpen: false,
      createStep: 1,
      newUser: INITIAL_NEW_USER,
      permissionMatrix: DEFAULT_PERMISSIONS,
    }),
}));
