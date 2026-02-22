import { prisma } from "@/lib/prisma";

export async function GET() {
  const entries = await prisma.guestbookEntry.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, message: true, createdAt: true },
  });

  return Response.json(entries);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, message } = body;

  if (!name?.trim() || !message?.trim()) {
    return Response.json({ error: "name, message 필수" }, { status: 400 });
  }
  if (name.trim().length > 50) {
    return Response.json({ error: "이름은 50자 이내로 작성해주세요" }, { status: 400 });
  }
  if (message.trim().length > 500) {
    return Response.json({ error: "메시지는 500자 이내로 작성해주세요" }, { status: 400 });
  }

  await prisma.guestbookEntry.create({
    data: {
      name: name.trim(),
      message: message.trim(),
      approved: false,
    },
  });

  return Response.json({ ok: true }, { status: 201 });
}
