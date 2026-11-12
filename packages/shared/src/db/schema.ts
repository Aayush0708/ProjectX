import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").notNull(), // better-auth user id; foreign key added on Day 5
  logoUrl: text("logo_url"),
  brandColor: text("brand_color"),
  createdAt: createdAt(),
});

export const proposalStatus = pgEnum("proposal_status", ["draft", "active", "archived"]);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clientName: text("client_name").notNull(),
    clientSlug: text("client_slug").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: proposalStatus("status").notNull().default("draft"),
    currentVersionId: uuid("current_version_id"), // no FK: versions point back here
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("proposals_url_unique").on(t.workspaceId, t.clientSlug, t.slug)],
);

export const sourceType = pgEnum("source_type", ["pdf", "docx", "pptx", "html"]);
export const conversionStatus = pgEnum("conversion_status", ["pending", "ready", "failed"]);

export const proposalVersions = pgTable(
  "proposal_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    sourceType: sourceType("source_type").notNull(),
    originalKey: text("original_key").notNull(), // storage path of the uploaded file
    pdfKey: text("pdf_key"), // set after conversion (PDF, DOCX, PPTX)
    htmlKey: text("html_key"), // set after processing (HTML)
    pageCount: integer("page_count"),
    conversionStatus: conversionStatus("conversion_status").notNull().default("pending"),
    conversionError: text("conversion_error"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("versions_unique").on(t.proposalId, t.version)],
);

export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(), // the ?r= part of the link
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    allowDownload: boolean("allow_download").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("links_proposal_idx").on(t.proposalId)],
);