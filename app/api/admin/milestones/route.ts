import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const milestones = await prisma.milestone.findMany({
    orderBy: { date: "desc" },
  });

  return Response.json(milestones);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { type, title, date, notes, visibility } = body;

  if (!type || !title?.trim() || !date) {
    return Response.json({ error: "type, title, date 필수" }, { status: 400 });
  }

  const milestone = await prisma.milestone.create({
    data: {
      type,
      title: title.trim(),
      date: new Date(date),
      notes: notes?.trim() || null,
      visibility: visibility ?? "PRIVATE",
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Milestone",
      entityId: milestone.id,
    });
  } catch {}

  return Response.json({ id: milestone.id }, { status: 201 });
}
