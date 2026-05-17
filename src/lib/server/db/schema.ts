import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const player = pgTable("player", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  elo: integer("elo").notNull().default(1200),
  gamesPlayed: integer("games_played").notNull().default(0),
  boardTheme: varchar("board_theme", { length: 20 }).notNull().default("neon"),
  pieceTheme: varchar("piece_theme", { length: 40 })
    .notNull()
    .default("kiwen-suwi-neon-glowy"),
  language: varchar("language", { length: 2 })
    .notNull()
    .default("es")
    .$type<"es" | "en">(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const game = pgTable(
  "game",
  {
    id: serial("id").primaryKey(),
    whiteId: integer("white_id")
      .notNull()
      .references(() => player.id, { onDelete: "cascade" }),
    blackId: integer("black_id")
      .notNull()
      .references(() => player.id, { onDelete: "cascade" }),
    result: varchar("result", { length: 10 }).notNull(),
    whiteEloBefore: integer("white_elo_before").notNull(),
    blackEloBefore: integer("black_elo_before").notNull(),
    whiteEloAfter: integer("white_elo_after").notNull(),
    blackEloAfter: integer("black_elo_after").notNull(),
    endReason: varchar("end_reason", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "game_result_check",
      sql`${t.result} IN ('white', 'black', 'draw')`,
    ),
    check(
      "game_end_reason_check",
      sql`${t.endReason} IN ('checkmate','stalemate','threefold','insufficient','fifty_move','resign','timeout','disconnect')`,
    ),
  ],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => player.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
