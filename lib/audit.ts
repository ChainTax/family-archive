import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

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
  | "GuestbookEntry";

interface CreateAuditLogArgs {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  diff?: Prisma.InputJsonValue;
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
