import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const player = pgTable("player", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const friendRequest = pgTable(
  "friend_request",
  {
    requesterId: integer("requester_id")
      .notNull()
      .references(() => player.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id")
      .notNull()
      .references(() => player.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 10 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.requesterId, t.addresseeId] }),
    check(
      "friend_request_status_check",
      sql`${t.status} IN ('pending', 'accepted', 'declined')`,
    ),
    check("friend_request_self_check", sql`${t.requesterId} <> ${t.addresseeId}`),
  ],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => player.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
