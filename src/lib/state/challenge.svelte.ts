import { send, subscribe } from "$lib/state/ws-conn";

const INVITE_ACK_TIMEOUT_MS = 4000;
const pendingInviteTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

export type IncomingInvite = {
  inviteId: string;
  fromId: number;
  fromUsername: string;
};

export type OutgoingInvite = {
  inviteId: string;
  toId: number;
  toUsername: string;
};

export const invitesState = $state({
  incoming: [] as IncomingInvite[],
  outgoing: [] as OutgoingInvite[],
});

export const challengeError = $state({ message: null as string | null });

let unsubWs: (() => void) | null = null;

export function startInvitesBridge(): void {
  if (unsubWs) return;
  unsubWs = subscribe((msg) => {
    switch (msg.type) {
      case "invite_received": {
        invitesState.incoming.push({
          inviteId: msg.inviteId,
          fromId: msg.fromId,
          fromUsername: msg.fromUsername,
        });
        break;
      }
      case "invite_sent": {
        const toId = msg.toId as number;
        const t = pendingInviteTimeouts.get(toId);
        if (t) {
          clearTimeout(t);
          pendingInviteTimeouts.delete(toId);
        }
        const optimisticId = `optimistic:${toId}`;
        const existing = invitesState.outgoing.find(
          (i) => i.inviteId === optimisticId,
        );
        if (existing) {
          invitesState.outgoing = invitesState.outgoing.map((i) =>
            i.inviteId === optimisticId ? { ...i, inviteId: msg.inviteId } : i,
          );
        } else {
          invitesState.outgoing.push({
            inviteId: msg.inviteId,
            toId,
            toUsername: msg.toUsername ?? `#${toId}`,
          });
        }
        break;
      }
      case "invite_error": {
        for (const [toId, t] of pendingInviteTimeouts) {
          clearTimeout(t);
          pendingInviteTimeouts.delete(toId);
        }
        invitesState.outgoing = invitesState.outgoing.filter(
          (i) => !i.inviteId.startsWith("optimistic:"),
        );
        challengeError.message = describeInviteError(msg.reason);
        break;
      }
      case "invite_declined":
      case "invite_cancelled":
      case "invite_expired": {
        invitesState.incoming = invitesState.incoming.filter(
          (i) => i.inviteId !== msg.inviteId,
        );
        invitesState.outgoing = invitesState.outgoing.filter(
          (i) => i.inviteId !== msg.inviteId,
        );
        break;
      }
      case "match": {
        invitesState.incoming = [];
        invitesState.outgoing = [];
        break;
      }
    }
  });
}

export function stopInvitesBridge(): void {
  unsubWs?.();
  unsubWs = null;
  for (const t of pendingInviteTimeouts.values()) clearTimeout(t);
  pendingInviteTimeouts.clear();
}

export function sendInvite(toUserId: number, toUsername: string): void {
  if (invitesState.outgoing.some((i) => i.toId === toUserId)) return;
  challengeError.message = null;
  const optimisticId = `optimistic:${toUserId}`;
  invitesState.outgoing.push({
    inviteId: optimisticId,
    toId: toUserId,
    toUsername,
  });
  send({ type: "invite", toUserId });
  const t = setTimeout(() => {
    pendingInviteTimeouts.delete(toUserId);
    invitesState.outgoing = invitesState.outgoing.filter(
      (i) => i.inviteId !== optimisticId,
    );
    challengeError.message =
      "No se pudo enviar el reto. ¿Está el otro jugador conectado?";
  }, INVITE_ACK_TIMEOUT_MS);
  pendingInviteTimeouts.set(toUserId, t);
}

function describeInviteError(reason: unknown): string {
  if (typeof reason !== "string") return "No se pudo enviar el reto.";
  switch (reason) {
    case "user_offline":
      return "Ese jugador no está conectado ahora mismo.";
    case "already_in_game":
      return "Ese jugador ya está en otra partida.";
    case "self_invite":
      return "No puedes retarte a ti mismo.";
    default:
      return `No se pudo enviar el reto (${reason}).`;
  }
}
