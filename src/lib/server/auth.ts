import { dev } from "$app/environment";
import { hash, verify } from "@node-rs/argon2";
import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { session, player } from "./db/schema";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // refresh when <15 days left

export const SESSION_COOKIE = "session";

export type SessionUser = {
	id: number;
	username: string;
	boardTheme: string;
	pieceTheme: string;
};
export type SessionRecord = { id: string; userId: number; expiresAt: Date };

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

function tokenToSessionId(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
	token: string,
	userId: number,
): Promise<SessionRecord> {
	const id = tokenToSessionId(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	await db.insert(session).values({ id, userId, expiresAt });
	return { id, userId, expiresAt };
}

export async function validateSessionToken(
	token: string,
): Promise<{ session: SessionRecord; user: SessionUser } | null> {
	const id = tokenToSessionId(token);
	const [row] = await db
		.select({
			sessionId: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt,
			username: player.username,
			boardTheme: player.boardTheme,
			pieceTheme: player.pieceTheme,
		})
		.from(session)
		.innerJoin(player, eq(session.userId, player.id))
		.where(eq(session.id, id))
		.limit(1);

	if (!row) return null;

	if (Date.now() >= row.expiresAt.getTime()) {
		await db.delete(session).where(eq(session.id, id));
		return null;
	}

	let expiresAt = row.expiresAt;
	if (row.expiresAt.getTime() - Date.now() < SESSION_REFRESH_THRESHOLD_MS) {
		expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db.update(session).set({ expiresAt }).where(eq(session.id, id));
	}

	return {
		session: { id: row.sessionId, userId: row.userId, expiresAt },
		user: {
			id: row.userId,
			username: row.username,
			boardTheme: row.boardTheme,
			pieceTheme: row.pieceTheme,
		},
	};
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(session).where(eq(session.id, sessionId));
}

export async function hashPassword(password: string): Promise<string> {
	return hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
}

export async function verifyPassword(
	stored: string,
	provided: string,
): Promise<boolean> {
	return verify(stored, provided);
}

export const SESSION_COOKIE_OPTIONS = {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	secure: !dev,
} as const;
