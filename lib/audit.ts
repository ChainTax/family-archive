import { prisma } from "./prisma";

type JsonValue = string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export type AuditAction =
  | "SIGN_IN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "VISIBILITY_CHANGE";

export type AuditEntityType =
  | "User"
  | "Post"
  | "Album"
  | "Photo"
  | "Place"
  | "Milestone"
  | "GuestbookEntry"
  | "GrowthRecord";

interface CreateAuditLogArgs {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  diff?: JsonValue;
}

export async function createAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  diff,
}: CreateAuditLogArgs): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      diff,
    },
  });
}
