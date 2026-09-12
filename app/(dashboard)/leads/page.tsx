"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOutletContext } from "@/lib/context";
import {
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Users,
  Search,
  FolderOpen,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/layout/Loading";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { canManageLeads, hasPermission } from "@/lib/permissions";

import {
  useLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} from "@/hooks/queries/useLeads";
import { useLeadStore } from "@/stores/useLeadStore";

function Leads() {
  const router = useRouter();
  const outlet = useOutletContext();
  const access = outlet?.permissions;

  useEffect(() => {
    if (access && !canManageLeads(access)) {
      router.push("/no-permission");
    }
  }, [access, router]);

  const {
    listPage: page,
    setListPage: setPage,
    listSearch: search,
    setListSearch: setSearch,
    selectedLead,
    setSelectedLead,
    editLeadTitle: title,
    setEditLeadTitle: setTitle,
    leadCategoryToDelete: leadToDelete,
    setLeadCategoryToDelete: setLeadToDelete,
    newLeadCategoryTitle: newLeadTitle,
    setNewLeadCategoryTitle: setNewLeadTitle,
    isCreatingNewLead,
    setIsCreatingNewLead,
  } = useLeadStore();

  const leadsPerPage = 10;

  const { data: leadsData, isLoading: loading } = useLeadsQuery({
    page,
    limit: leadsPerPage,
  });

  const createLeadMutation = useCreateLeadMutation();
  const updateLeadMutation = useUpdateLeadMutation();
  const deleteLeadMutation = useDeleteLeadMutation();

  const leads = leadsData?.leads || [];

  // Granular loading states
  const updatingLeadId = updateLeadMutation.isPending ? selectedLead?.id : null;
  const deletingId = deleteLeadMutation.isPending ? leadToDelete?.id : null;
  const creatingLead = createLeadMutation.isPending;

  const handleUpdate = async () => {
    if (!selectedLead) return;
    try {
      await updateLeadMutation.mutateAsync({
        id: String(selectedLead.id),
        title: title || null,
      });
      setSelectedLead(null);
    } catch {}
  };

  const deleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLeadMutation.mutateAsync(String(leadToDelete.id));
      setLeadToDelete(null);
    } catch {}
  };

  const handleCreateNewLead = async () => {
    if (!newLeadTitle.trim()) {
      toast.error("Lead category title cannot be empty.");
      return;
    }

    try {
      await createLeadMutation.mutateAsync(newLeadTitle.trim());
      setNewLeadTitle("");
      setIsCreatingNewLead(false);
    } catch {}
  };

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (leads.length === leadsPerPage) setPage(page + 1);
  };

  const filteredResponses = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter((lead: any) => (lead.title || "").toLowerCase().includes(q));
  }, [search, leads]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-start px-2 py-4"
        >
          {/* Search & Actions Bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:w-80 md:w-96 max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search lead categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/60 backdrop-blur-xl border-border/50"
              />
            </div>

            {canManageLeads(access) && (
              <Button
                size="lg"
                className="h-11 gap-2 w-full sm:w-auto font-medium"
                onClick={() => setIsCreatingNewLead(true)}
              >
                <PlusCircle className="h-4 w-4" />
                New Lead Category
              </Button>
            )}
          </div>

          {/* List of Leads */}
          <div className="w-full">
            {filteredResponses.length === 0 ? (
              <Card className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <CardContent className="py-16">
                  <div className="text-center">
                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold text-muted-foreground mb-2">
                      No lead categories found
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {search
                        ? "Try adjusting your search query"
                        : "Get started by creating your first lead category to organize team leads."}
                    </p>
                    {canManageLeads(access) && !search && (
                      <Button
                        variant="outline"
                        className="mt-6 gap-2"
                        onClick={() => setIsCreatingNewLead(true)}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Create Lead Category
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl bg-background/60 border border-border/50 backdrop-blur-xl w-full">
                <ul className="divide-y divide-border/50">
                  {filteredResponses.map((lead: any, idx: number) => (
                    <li
                      key={lead.id}
                      className="p-6 flex items-start gap-6 md:gap-8 group hover:bg-background/40 transition-colors"
                    >
                      {/* Left Badge - Index / Category Accent */}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 text-primary flex items-center justify-center font-bold text-xl shadow-sm group-hover:border-primary/40 group-hover:scale-105 transition-all">
                          {idx + 1 + page * leadsPerPage}
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg md:text-xl line-clamp-1 text-foreground">
                            {lead.title}
                          </h3>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {lead.memberCount || 0} {lead.memberCount === 1 ? "member" : "members"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[105px] h-9 gap-1.5"
                            onClick={() =>
                              router.push(
                                `/leads/details?id=${encodeURIComponent(lead.id)}&title=${encodeURIComponent(lead.title || "")}`
                              )
                            }
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            View Members
                          </Button>

                          {canManageLeads(access) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[90px] h-9 gap-1.5"
                              onClick={() => {
                                setSelectedLead(lead);
                                setTitle(lead.title || "");
                              }}
                            >
                              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                              Edit
                            </Button>
                          )}

                          {hasPermission(access, "leads", "deleteLead") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-[90px] h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40"
                              onClick={() => setLeadToDelete(lead)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Right Count */}
                      <div className="shrink-0 text-right w-24">
                        <div className="text-xs text-muted-foreground font-medium">Members</div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                          {lead.memberCount ?? 0}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {filteredResponses.length > 0 && (
              <div className="fixed bottom-6 right-8 z-30 pointer-events-auto">
                <div className="inline-flex items-center gap-3 rounded-full bg-background/85 backdrop-blur-2xl border border-border/80 px-4 py-2.5 shadow-xl text-xs text-muted-foreground transition-all duration-200 hover:shadow-2xl">
                  <span>
                    Showing{" "}
                    <strong className="text-foreground font-semibold">
                      {page * leadsPerPage + 1} - {page * leadsPerPage + leads.length}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground font-semibold">
                      {filteredResponses.length}
                    </strong>{" "}
                    leads
                  </span>
                  <div className="flex items-center gap-1 border-l border-border/60 pl-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full hover:bg-accent"
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full hover:bg-accent"
                      onClick={handleNextPage}
                      disabled={leads.length < leadsPerPage}
                    >
                      <ChevronRight className="size-3.5" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edit Lead Dialog */}
          <Dialog
            open={Boolean(selectedLead)}
            onOpenChange={(open) => !open && setSelectedLead(null)}
          >
            {selectedLead && (
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Lead Category</DialogTitle>
                  <DialogDescription>Update the details of the lead category.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lead Category Title"
                    className="h-11"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUpdate();
                      }
                    }}
                  />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleUpdate}
                    disabled={updatingLeadId === selectedLead.id || !title.trim()}
                  >
                    {updatingLeadId === selectedLead.id ? (
                      <span className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>

          {/* Delete Lead AlertDialog */}
          <AlertDialog
            open={Boolean(leadToDelete)}
            onOpenChange={(open) => !open && setLeadToDelete(null)}
          >
            {leadToDelete && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{" "}
                    <strong className="text-foreground">{leadToDelete.title}</strong> and all associated members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteLead}
                    disabled={deletingId === leadToDelete.id}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deletingId === leadToDelete.id ? (
                      <span className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>

          {/* Create New Lead Dialog */}
          <Dialog
            open={isCreatingNewLead}
            onOpenChange={(open) => !open && setIsCreatingNewLead(false)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Lead Category</DialogTitle>
                <DialogDescription>Enter a title for the new lead category.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <Input
                  value={newLeadTitle}
                  onChange={(e) => setNewLeadTitle(e.target.value)}
                  placeholder="e.g. Lead 2024 - 2025"
                  className="h-11"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateNewLead();
                    }
                  }}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateNewLead}
                  disabled={creatingLead || !newLeadTitle.trim()}
                >
                  {creatingLead ? (
                    <span className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="w-full mt-12 text-center">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="https://socflow.app"
                target="_blank"
                className="text-foreground font-medium hover:underline ml-1"
                rel="noreferrer"
              >
                Socflow
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default Leads;
