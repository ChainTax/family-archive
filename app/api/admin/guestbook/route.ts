import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const entries = await prisma.guestbookEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(entries);
}
