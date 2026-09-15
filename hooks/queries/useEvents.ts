import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const EVENTS_QUERY_KEY = ["events"];
export const EVENT_DETAILS_KEY = (id: any) => ["event", id];
export const EVENT_REGISTRATIONS_KEY = (eventId: any, isCompetition: any) => [
  "eventRegistrations",
  eventId,
  Boolean(isCompetition),
];
export const EVENT_WINNERS_KEY = (eventId: any) => ["eventWinners", eventId];

interface EventsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

// Fetch events with pagination & enrichment
export function useEventsQuery({
  page = 0,
  limit = 10,
  search = "",
  status = "all",
}: EventsQueryParams = {}) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, { page, limit, search, status }],
    queryFn: async () => {
      const res = await fetch(
        `/api/events?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch events");
      const json = await res.json();
      return {
        events: json.events || [],
        total: json.total || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Fetch all events (e.g. for Home dashboard stats)
export function useAllEventsQuery() {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, "all"],
    queryFn: async () => {
      const res = await fetch("/api/events?all=true");
      if (!res.ok) throw new Error("Failed to fetch all events");
      const json = await res.json();
      return json.events || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Fetch single event details
export function useEventDetailsQuery(eventId: any) {
  return useQuery({
    queryKey: EVENT_DETAILS_KEY(eventId),
    queryFn: async () => {
      if (!eventId) return null;
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event details");
      const json = await res.json();
      return json.event;
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 5,
  });
}

// Create event mutation
export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventPayload: any) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      if (!res.ok) throw new Error("Failed to create event");
      const json = await res.json();
      return json.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      toast.success("Event created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create event");
    },
  });
}

// Update event mutation
export function useUpdateEventMutation(optionalEventId?: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: any) => {
      const targetId = patch?.id || optionalEventId;
      const res = await fetch(`/api/events/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update event");
      const json = await res.json();
      return json.event;
    },
    onSuccess: (data, variables: any) => {
      const targetId = variables?.id || optionalEventId;
      if (targetId) {
        queryClient.setQueryData(EVENT_DETAILS_KEY(targetId), data);
      }
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      toast.success("Event updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update event");
    },
  });
}

// Delete event mutation
export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      toast.success("Event deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete event");
    },
  });
}

// Fetch event registrations
export function useEventRegistrationsQuery(eventId: any, isCompetition?: boolean) {
  return useQuery({
    queryKey: EVENT_REGISTRATIONS_KEY(eventId, isCompetition),
    queryFn: async () => {
      if (!eventId) return [];
      const res = await fetch(
        `/api/events/${eventId}/registrations?isCompetition=${Boolean(isCompetition)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const json = await res.json();
      return json.registrations || [];
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 2,
  });
}

// Toggle attendance mutation
export function useToggleAttendanceMutation(eventId: any, isCompetition?: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      registrationId?: any;
      attended?: boolean;
      id?: any;
      patch?: any;
    }) => {
      const regId = payload.registrationId ?? payload.id;
      const att =
        payload.attended ??
        payload.patch?.attended ??
        payload.patch?.attendance ??
        payload.patch?.status ??
        false;
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, attended: att, isCompetition }),
      });
      if (!res.ok) throw new Error("Failed to toggle attendance");
      return { registrationId: regId, attended: att };
    },
    onSuccess: ({ registrationId, attended }) => {
      queryClient.setQueryData(
        EVENT_REGISTRATIONS_KEY(eventId, isCompetition),
        (oldData: any[]) =>
          oldData?.map((r) => (r.id === registrationId ? { ...r, attended } : r)) || [],
      );
      toast.success(`Attendance updated to ${attended ? "Present" : "Absent"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update attendance");
    },
  });
}

// Delete registration mutation
export function useDeleteRegistrationMutation(eventId: any, isCompetition?: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(
        `/api/events/${eventId}/registrations?registrationId=${id}&isCompetition=${Boolean(isCompetition)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete registration");
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(
        EVENT_REGISTRATIONS_KEY(eventId, isCompetition),
        (old: any[]) => old?.filter((r) => r.id !== id) || [],
      );
      toast.success("Registration deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete registration");
    },
  });
}

// Fetch competition winners
export function useCompetitionWinnersQuery(eventId: any) {
  return useQuery({
    queryKey: EVENT_WINNERS_KEY(eventId),
    queryFn: async () => {
      if (!eventId) return [];
      const res = await fetch(`/api/events/${eventId}/winners`);
      if (!res.ok) throw new Error("Failed to fetch winners");
      const json = await res.json();
      return json.winners || [];
    },
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 5,
  });
}

// Add competition winner mutation
export function useAddCompetitionWinnerMutation(eventId: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (winnerPayload: any) => {
      const res = await fetch(`/api/events/${eventId}/winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(winnerPayload),
      });
      if (!res.ok) throw new Error("Failed to add winner");
      const json = await res.json();
      return json.winner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_WINNERS_KEY(eventId) });
      toast.success("Winner added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add winner");
    },
  });
}

// Delete competition winner mutation
export function useDeleteCompetitionWinnerMutation(eventId: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (winnerId: any) => {
      const res = await fetch(`/api/events/${eventId}/winners?winnerId=${winnerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete winner");
      return winnerId;
    },
    onSuccess: (winnerId) => {
      queryClient.setQueryData(
        EVENT_WINNERS_KEY(eventId),
        (old: any[]) => old?.filter((w) => w.id !== winnerId) || [],
      );
      toast.success("Winner deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete winner");
    },
  });
}

export const useWinnersQuery = useCompetitionWinnersQuery;
export const useAddWinnerMutation = useAddCompetitionWinnerMutation;
export const useDeleteWinnerMutation = useDeleteCompetitionWinnerMutation;
export const useUpdateRegistrationMutation = useToggleAttendanceMutation;
