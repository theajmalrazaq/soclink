"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUp, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { canUseAssistant } from "@/lib/permissions";
import { useCreateEventMutation } from "@/hooks/queries/useEvents";
import { useCreateLeadMutation } from "@/hooks/queries/useLeads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Draft = {
  kind: "event" | "competition" | "lead" | "lead_member" | "manage" | "unsupported";
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  link_primary: string;
  link_secondary: string;
  lead_category: string;
  email: string;
  phone: string;
  designation: string;
  question: string;
  resource: string;
  action: string;
  target: string;
  field: string;
  value: string;
};

type LeadCategory = { id: number; title: string | null };
type ManageCandidate = { id: number; label: string; detail: string; currentValue: string | null; score: number };
type ChatMessage = { id: number; role: "user" | "assistant"; content: string };

export default function AiCommandComposer({ access }: { access: any }) {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [candidates, setCandidates] = useState<ManageCandidate[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [leadId, setLeadId] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const nextMessageId = useRef(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const queryClient = useQueryClient();
  const createEvent = useCreateEventMutation();
  const createLead = useCreateLeadMutation();
  const isSaving = createEvent.isPending || createLead.isPending || isExecuting;

  if (!canUseAssistant(access)) return null;

  const updateDraft = (key: keyof Draft, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const prepare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = prompt.trim();
    if (!request || isPreparing) return;
    const priorHistory = history.length > 10 ? [history[0], ...history.slice(-9)] : history;
    setMessage("");
    setMessageError(false);
    setIsPreparing(true);
    try {
      const response = await apiFetch("/api/assistant/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: request,
          history: priorHistory.map(({ role, content }) => ({ role, content })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not prepare a draft.");
      if (result.draft.kind === "unsupported") {
        setMessage(result.draft.question || "I cannot prepare that action yet.");
        setMessageError(false);
        setHistory([]);
      } else if (result.needsClarification) {
        setHistory([
          ...priorHistory,
          { id: ++nextMessageId.current, role: "user", content: request },
          { id: ++nextMessageId.current, role: "assistant", content: result.draft.question },
        ]);
        setPrompt("");
      } else {
        if (result.draft.kind === "manage") {
          const params = new URLSearchParams({
            resource: result.draft.resource,
            action: result.draft.action,
            target: result.draft.target,
            field: result.draft.field,
          });
          const targetsResponse = await apiFetch(`/api/assistant/targets?${params}`);
          const targetsResult = await targetsResponse.json();
          if (!targetsResponse.ok) throw new Error(targetsResult.error || "Could not find the target record.");
          const matches = targetsResult.candidates as ManageCandidate[];
          setCandidates(matches);
          setSelectedTargetId(matches.length === 1 && matches[0].score >= 90 ? String(matches[0].id) : "");
        } else if (result.draft.kind === "lead_member") {
          const categoriesResponse = await apiFetch(`/api/leads?search=${encodeURIComponent(result.draft.lead_category)}&limit=500`);
          const categoriesResult = await categoriesResponse.json();
          if (!categoriesResponse.ok) throw new Error("Could not load lead categories.");
          const available = (categoriesResult.leads || []) as LeadCategory[];
          setCategories(available);
          const categoryName = result.draft.lead_category.trim().toLowerCase();
          const match = available.find((category) => category.title?.trim().toLowerCase() === categoryName);
          setLeadId(match ? String(match.id) : "");
        }
        setDraft(result.draft);
        setHistory([]);
        setPrompt("");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not prepare a draft.");
      setMessageError(true);
    } finally {
      setIsPreparing(false);
    }
  };

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || isSaving) return;
    if (draft.kind === "manage") {
      const candidate = candidates.find((item) => String(item.id) === selectedTargetId);
      if (!candidate) {
        toast.error("Choose the exact record to change.");
        return;
      }
      setIsExecuting(true);
      try {
        const response = await apiFetch("/api/assistant/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource: draft.resource,
            action: draft.action,
            id: candidate.id,
            expectedLabel: candidate.label,
            field: draft.action === "delete" ? "" : draft.field,
            value: draft.action === "delete" ? "" : draft.value,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not complete the action.");
        await queryClient.invalidateQueries();
        setMessage(`${candidate.label}: ${draft.action === "delete" ? "deleted" : "updated"}.`);
        setMessageError(false);
        toast.success(`${draft.resource.replace("_", " ")} ${draft.action === "delete" ? "deleted" : "updated"}`);
        setDraft(null);
        setHistory([]);
        setPrompt("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not complete the action.");
      } finally {
        setIsExecuting(false);
      }
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      toast.error("Add a title before creating this item.");
      return;
    }
    if ((draft.kind === "event" || draft.kind === "competition") &&
      (!draft.description.trim() || !draft.date || !draft.time)) {
      toast.error("Add a description, date, and start time before creating this item.");
      return;
    }
    try {
      if (draft.kind === "lead") {
        await createLead.mutateAsync(title);
      } else if (draft.kind === "lead_member") {
        if (!leadId) {
          toast.error("Choose a lead category first.");
          return;
        }
        const response = await apiFetch(`/api/leads/${encodeURIComponent(leadId)}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: title,
            email: draft.email.trim() || null,
            phone: draft.phone.trim() || null,
            designation: draft.designation.trim() || null,
          }),
        });
        if (!response.ok) throw new Error("Could not create lead member.");
        toast.success("Lead member created successfully");
      } else if (draft.kind === "event" || draft.kind === "competition") {
        await createEvent.mutateAsync({
          title,
          description: draft.description.trim() || null,
          date: draft.date || null,
          time: draft.time || null,
          location: draft.location.trim() || null,
          speaker: draft.speaker.trim() || null,
          link_primary: draft.link_primary.trim() || null,
          link_secondary: draft.link_secondary.trim() || null,
          is_competition: draft.kind === "competition",
        });
      }
      setDraft(null);
      setPrompt("");
      setMessage("");
      setHistory([]);
    } catch (error) {
      if (draft.kind === "lead_member")
        toast.error(error instanceof Error ? error.message : "Could not create lead member.");
      // The existing creation mutations display their own API errors.
    }
  };

  const kindLabel = draft?.kind === "lead" ? "lead category" : draft?.kind === "lead_member" ? "lead member" : draft?.kind || "item";
  const selectedCandidate = candidates.find((item) => String(item.id) === selectedTargetId);

  return (
    <>
      <section
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto max-w-3xl md:left-[284px]"
        aria-label="Manage with GroqCloud"
      >
        {(history.length > 0 || message || isPreparing) && (
          <div className="mb-2 rounded-xl border bg-card p-3 shadow-lg" aria-label="AI conversation" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">GroqCloud assistant</span>
              {history.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => { setHistory([]); setPrompt(""); setMessage(""); }} disabled={isPreparing}>Start over</Button>}
            </div>
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="h-56">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="gap-3 p-1">
                    {history.map((item) => (
                      <MessageScrollerItem key={item.id} messageId={String(item.id)} scrollAnchor>
                        <Message align={item.role === "user" ? "end" : "start"}>
                          <MessageContent>
                            <Bubble variant={item.role === "user" ? "default" : "muted"} align={item.role === "user" ? "end" : "start"}>
                              <BubbleContent className="whitespace-pre-wrap">{item.content}</BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                    {(message || isPreparing) && (
                      <MessageScrollerItem messageId="assistant-status" scrollAnchor>
                        <Message>
                          <MessageContent>
                            <Bubble variant={messageError ? "destructive" : "muted"}>
                              <BubbleContent className="flex items-center gap-2 whitespace-pre-wrap">
                                {isPreparing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {message || "Preparing a draft…"}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </div>
        )}
        <form onSubmit={prepare} className="ai-composer-border relative isolate rounded-[2rem] bg-card/65 shadow-xl backdrop-blur-xl dark:bg-card/55">
          <Label htmlFor="ai-command-input" className="sr-only">What would you like to create?</Label>
          <InputGroup className="rounded-[2rem] border-border/50 bg-transparent px-3 shadow-none dark:bg-transparent">
            <InputGroupTextarea
              id="ai-command-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={history.length ? "Reply with the missing details..." : "Ask GroqCloud to create, update, or delete a record..."}
              maxLength={2000}
              rows={1}
              disabled={isPreparing}
              className="max-h-28 min-h-14 px-2 py-[1.125rem] leading-5"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="icon-sm" className="size-9 rounded-full" disabled={isPreparing || !prompt.trim()} aria-label={isPreparing ? "Preparing draft" : "Prepare draft"}>
                {isPreparing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="pt-1.5 text-center text-xs text-muted-foreground">Review and confirm every change before it is applied.</p>
      </section>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !isSaving) setDraft(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.kind === "manage" ? `Review ${draft.action} ${draft.resource.replace("_", " ")}` : `Review ${kindLabel} draft`}</DialogTitle>
            <DialogDescription>{draft?.kind === "manage" ? "Choose the exact record and review the change. Nothing happens until you confirm." : "Edit any details, then confirm to create it. Nothing is saved until you confirm."}</DialogDescription>
          </DialogHeader>
          {draft && (
            <form onSubmit={confirm} className="space-y-4">
              {draft.question && <p className="rounded-lg bg-muted p-3 text-sm">{draft.question}</p>}
              {draft.kind === "manage" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="draft-target">Record to {draft.action}</Label>
                    <select id="draft-target" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedTargetId} onChange={(event) => setSelectedTargetId(event.target.value)} required>
                      <option value="">Select the exact record</option>
                      {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label} {candidate.detail ? `— ${candidate.detail}` : ""} (#{candidate.id})</option>)}
                    </select>
                  </div>
                  {selectedCandidate && <p className="text-sm text-muted-foreground">Selected: {selectedCandidate.label} (ID {selectedCandidate.id}){draft.action !== "delete" ? ` · Current ${draft.field}: ${selectedCandidate.currentValue || "empty"}` : ""}</p>}
                  {draft.action === "delete" ? (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">This deletes the selected record. Confirm only after checking its name and ID.</p>
                  ) : draft.action === "status" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="draft-status">New status</Label>
                      <select id="draft-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.value} onChange={(event) => updateDraft("value", event.target.value)} required>
                        <option value="true">{draft.resource === "induction" ? "Selected" : draft.resource === "email" ? "Responded" : "Active"}</option>
                        <option value="false">{draft.resource === "induction" ? "Rejected" : draft.resource === "email" ? "On hold" : "Inactive"}</option>
                        {(draft.resource === "induction" || draft.resource === "email") && <option value="null">Waiting</option>}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="draft-value">New {draft.field.replace(/_/g, " ")}</Label>
                      {draft.field === "description" ?
                        <Textarea id="draft-value" value={draft.value} onChange={(event) => updateDraft("value", event.target.value)} maxLength={5000} rows={3} /> :
                        <Input id="draft-value" value={draft.value} onChange={(event) => updateDraft("value", event.target.value)} maxLength={1000} required />}
                    </div>
                  )}
                </>
              )}
              {draft.kind !== "manage" && <div className="space-y-1.5">
                <Label htmlFor="draft-title">{draft.kind === "lead_member" ? "Name" : "Title"}</Label>
                <Input id="draft-title" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={200} required />
              </div>}
              {draft.kind === "lead_member" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="draft-lead-category">Lead category</Label>
                    <select id="draft-lead-category" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)} required>
                      <option value="">Select a category</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
                    </select>
                    {categories.length === 0 && <p className="text-sm text-muted-foreground">Create a lead category first.</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><Label htmlFor="draft-email">Email</Label><Input id="draft-email" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} maxLength={300} /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-phone">Phone</Label><Input id="draft-phone" type="tel" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} maxLength={100} /></div>
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="draft-designation">Designation</Label><Input id="draft-designation" value={draft.designation} onChange={(event) => updateDraft("designation", event.target.value)} maxLength={300} /></div>
                  </div>
                </>
              )}
              {(draft.kind === "event" || draft.kind === "competition") && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="draft-description">Description</Label>
                    <Textarea id="draft-description" value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} maxLength={5000} rows={3} required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><Label htmlFor="draft-date">Date</Label><Input id="draft-date" type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-time">Time</Label><Input id="draft-time" type="time" value={draft.time} onChange={(event) => updateDraft("time", event.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-location">Location</Label><Input id="draft-location" value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} maxLength={300} /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-speaker">Speaker</Label><Input id="draft-speaker" value={draft.speaker} onChange={(event) => updateDraft("speaker", event.target.value)} maxLength={300} /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-primary-link">Primary link</Label><Input id="draft-primary-link" type="url" value={draft.link_primary} onChange={(event) => updateDraft("link_primary", event.target.value)} maxLength={1000} /></div>
                    <div className="space-y-1.5"><Label htmlFor="draft-secondary-link">Secondary link</Label><Input id="draft-secondary-link" type="url" value={draft.link_secondary} onChange={(event) => updateDraft("link_secondary", event.target.value)} maxLength={1000} /></div>
                  </div>
                </>
              )}
              <Item variant="outline" size="sm" className="gap-3">
                <ItemMedia variant="icon"><Check className="size-4" aria-hidden="true" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>{draft.kind === "manage" ? `Confirm ${draft.action}` : `Confirm ${kindLabel}`}</ItemTitle>
                  <ItemDescription>Review the details above before continuing.</ItemDescription>
                </ItemContent>
                <ItemActions className="ml-auto flex-wrap justify-end">
                  <Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" variant={draft.kind === "manage" && draft.action === "delete" ? "destructive" : "default"} disabled={isSaving || (draft.kind === "manage" ? !selectedTargetId || (draft.action !== "delete" && !draft.value.trim()) : !draft.title.trim() || (draft.kind === "lead_member" && !leadId) || ((draft.kind === "event" || draft.kind === "competition") && (!draft.description.trim() || !draft.date || !draft.time)))}>
                    {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {draft.kind === "manage" ? `${draft.action === "delete" ? "Delete" : "Update"} ${draft.resource.replace("_", " ")}` : `Create ${kindLabel}`}
                  </Button>
                </ItemActions>
              </Item>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
