import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";

export const load = async () => {
  const [first] = await db.select().from(player).limit(1);
  const user = first ?? { id: 0, username: "guest", email: "" };
  return {
    user: { id: user.id, username: user.username },
  };
};
