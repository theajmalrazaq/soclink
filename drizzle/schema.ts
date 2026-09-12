import {
  pgTable,
  serial,
  bigserial,
  smallserial,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  bigint,
  uuid,
} from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name"),
  email: text("email"),
  role: text("role"),
  permissions: text("permissions"),
  user_id: text("user_id"),
  status: boolean("status"),
  user_name: text("user_name"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// 2. Events Table
export const events = pgTable("events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date"),
  time: text("time"),
  speaker: text("speaker"),
  location: text("location"),
  link_primary: text("link_primary"),
  link_secondary: text("link_secondary"),
  img_url: text("img_url"),
  is_competition: boolean("is_competition").default(false),
  linkone_text: text("linkone_text"),
  linktwo_text: text("linktwo_text"),
});

// 3. Event Registrations / Responses
export const eventsResponses = pgTable("eventsResponses", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  event_id: bigint("event_id", { mode: "number" }),
  name: text("name"),
  email: text("nu_email"),
  phone: text("whatsapp_no"),
  roll_no: text("roll_no"),
  status: boolean("status"),
  attended: boolean("attendance"),
  registered_at: timestamp("registered_at", { withTimezone: true }),
  referred: text("referred"),
});

// 4. Competition Registrations / Responses
export const competitionsResponses = pgTable("competitionsResponses", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  event_id: bigint("event_id", { mode: "number" }),
  team_name: text("team_name"),
  member_one_name: text("member_one_name"),
  member_one_rollno: text("member_one_rollno"),
  member_one_numail: text("member_one_numail"),
  member_two_name: text("member_two_name"),
  member_two_rollno: text("member_two_rollno"),
  member_two_numail: text("member_two_numail"),
  status: boolean("status"),
  link: text("link"),
  registered_at: timestamp("registered_at", { withTimezone: true }),
  attended: boolean("attendance"),
});

// 5. Competition Winners
export const competitionWinners = pgTable("competitionWinners", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id"),
  response_id: integer("response_id"),
  position: integer("position"),
  img_url: text("img_url"),
  createdAt: timestamp("created_at"),
});

// 6. Members Table
export const members = pgTable("members", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  email: text("nu_email"),
  phone: text("whatsapp_no"),
  roll_no: text("roll_no"),
  status: boolean("status").default(true),
  team: text("team"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

// 7. Leads & Leads Data
export const allLeads = pgTable("allLeads", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title"),
});

export const leadsData = pgTable("leadsData", {
  id: smallserial("id").primaryKey(),
  lead_id: bigint("lead_id", { mode: "number" }),
  name: text("name"),
  avatar: text("avatar"),
  designation: text("designation"),
  linkedin: text("linkedin"),
  email: text("nu_email"),
  phone: text("whatsapp_no"),
  roll_no: text("roll_no"),
  status: boolean("status").default(true),
});

// 8. Induction Responses
export const inductionResponses = pgTable("inductionResponses", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name"),
  roll_no: text("roll_no"),
  email: text("nu_email"),
  phone: text("whatsapp_no"),
  skills: text("skills"),
  experience: text("experience"),
  status: boolean("status"),
  team: text("team"),
  registered_at: timestamp("registered_at", { withTimezone: true }),
});

// 9. Contact Responses / Inquiries
export const contactResponses = pgTable("contactResponses", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("Name"),
  email: text("Email"),
  subject: text("Subject"),
  message: text("Message"),
  status: boolean("status"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

// 10. App Settings
export const appSettings = pgTable("appSettings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  induction: boolean("induction").default(true),
  upcomingevent: boolean("upcomingevent").default(false),
  upcomingeventstatus: boolean("upcomingeventstatus").default(true),
});

export const app_settings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  society_id: uuid("society_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 11. Certifications
export const certification = pgTable("certification", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  event_id: bigint("event_id", { mode: "number" }),
  name: text("name"),
  code: text("code"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

// 12. Societies
export const societies = pgTable("societies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  logo_url: text("logo_url"),
  cover_url: text("cover_url"),
  branding_color: text("branding_color").default("#2A43F8"),
  instagram_url: text("instagram_url"),
  linkedin_url: text("linkedin_url"),
  website_url: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
