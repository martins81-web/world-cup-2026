import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Users | World Cup 2026" };

export default async function AdminUsersPage() {
  await requireAdminPage();
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Admin Users</h1>
      <table className="mt-6 w-full rounded-md border bg-white text-sm">
        <caption className="sr-only">Admin users and assigned roles</caption>
        <thead className="bg-black/5 text-left"><tr><th className="p-3">Username</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.map((user) => <tr className="border-t" key={user.id}><td className="p-3">{user.username}</td><td>{user.role}</td><td>{user.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
