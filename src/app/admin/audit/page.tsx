import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit History | World Cup 2026" };

export default async function AuditPage() {
  await requireAdminPage();
  const events = await prisma.auditEvent.findMany({ include: { adminUser: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Audit History</h1>
      <table className="mt-6 w-full rounded-md border bg-white text-sm">
        <caption className="sr-only">Administrative audit history</caption>
        <thead className="bg-black/5 text-left"><tr><th className="p-3">When</th><th>Action</th><th>Entity</th><th>User</th></tr></thead>
        <tbody>{events.map((event) => <tr className="border-t" key={event.id}><td className="p-3">{event.createdAt.toISOString()}</td><td>{event.action}</td><td>{event.entityType ?? "Not available"} {event.entityId ?? ""}</td><td>{event.adminUser?.username ?? "System"}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
