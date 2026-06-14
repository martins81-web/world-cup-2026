import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | World Cup 2026"
};

export default async function AdminPage() {
  if (await isAdminAuthenticated()) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <nav className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            ["/admin/sync", "Synchronization"],
            ["/admin/users", "Users"],
            ["/admin/mapping-errors", "Mapping errors"],
            ["/admin/audit", "Audit history"]
          ].map(([href, label]) => <Link className="rounded-md border bg-white p-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ink" key={href} href={href}>{label}</Link>)}
        </nav>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <div className="mt-6">
        <AdminLoginForm />
      </div>
    </main>
  );
}
