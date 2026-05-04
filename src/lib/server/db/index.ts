import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL } from "$env/static/private";
import * as schema from "./schema";

// postgres-js forwards unknown URL params as PG runtime parameters, so
// `?host=/path/to/socket` (libpq convention) gets rejected by the server.
// Lift it to the options object instead.
function buildClient(url: string) {
	const parsed = new URL(url);
	const socketHost = parsed.searchParams.get("host");
	if (socketHost) {
		return postgres({
			host: socketHost,
			port: parsed.port ? Number(parsed.port) : undefined,
			database: parsed.pathname.slice(1),
			username: parsed.username || undefined,
			password: parsed.password || undefined,
		});
	}
	return postgres(url);
}

const client = buildClient(DATABASE_URL);

export const db = drizzle(client, { schema });
