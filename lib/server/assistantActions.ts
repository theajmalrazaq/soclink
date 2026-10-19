export const managePermissions: Record<string, Record<string, [string, string]>> = {
  event: { update: ["events", "editEvent"], delete: ["events", "deleteEvent"] },
  competition: { update: ["events", "editEvent"], delete: ["events", "deleteEvent"] },
  lead: { update: ["leads", "changeStatus"], delete: ["leads", "deleteLead"] },
  lead_member: { update: ["leads", "changeStatus"], status: ["leads", "changeStatus"], delete: ["leads", "deleteLead"] },
  member: { status: ["members", "changeStatus"], delete: ["members", "deleteMember"] },
  induction: { status: ["inductions", "changeStatus"], delete: ["inductions", "deleteResponse"] },
  email: { status: ["emails", "changeStatus"], delete: ["emails", "deleteEmail"] },
};

export const editableFields: Record<string, string[]> = {
  event: ["title", "description", "date", "time", "location", "speaker", "link_primary", "link_secondary"],
  competition: ["title", "description", "date", "time", "location", "speaker", "link_primary", "link_secondary"],
  lead: ["title"],
  lead_member: ["name", "email", "phone", "designation"],
};

export function validManageChange(resource: string, action: string, field: string, value: string): boolean {
  if (!managePermissions[resource]?.[action]) return false;
  if (action === "delete") return !field && !value;
  if (action === "status")
    return field === "status" && ["true", "false", "null"].includes(value) &&
      (value !== "null" || ["induction", "email"].includes(resource));
  if (!editableFields[resource]?.includes(field)) return false;
  if (field === "title" || field === "name") return Boolean(value.trim()) && value.length <= 200;
  if (field === "date") return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (field === "time") return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (field === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (field.startsWith("link_")) return !value || /^https?:\/\//i.test(value);
  return value.length <= (field === "description" ? 5000 : 1000);
}
