import { apiFetch } from "@/lib/apiFetch";
export const apiRequests = {
  emailsForExport: () => apiFetch("/api/emails?limit=10000"),
  membersForExport: () => apiFetch("/api/members?limit=10000"),
  inductionsForExport: () => apiFetch("/api/inductions?limit=10000"),
  activeMembers: () => apiFetch("/api/members?status=active&limit=1000"),
  membersForAnnouncement: () => apiFetch("/api/members?status=true"),
  leadMembers: (leadId: string | number) =>
    apiFetch(`/api/leads/${encodeURIComponent(leadId)}/members`),
  eventRegistrations: (eventId: string | number, isCompetition: boolean) =>
    apiFetch(
      `/api/events/${encodeURIComponent(eventId)}/registrations?isCompetition=${isCompetition}`,
    ),
  saveSociety: (society: Record<string, unknown>) =>
    apiFetch("/api/societies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(society),
    }),
  createUser: (user: { name: string; email: string }) =>
    apiFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }),
  certificate: (eventId: string | number, name: string) =>
    apiFetch(
      `/api/events/${encodeURIComponent(eventId)}/certifications?name=${encodeURIComponent(name)}`,
    ),
  createCertificate: (eventId: string | number, certificate: { name: string; code: string }) =>
    apiFetch(`/api/events/${encodeURIComponent(eventId)}/certifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certificate),
    }),
};
