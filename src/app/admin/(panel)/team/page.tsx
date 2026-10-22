import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { ROLES, roleLabel } from "@/lib/admin-roles";
import { removeStaffMember } from "@/app/admin/team-actions";
import { formatDate } from "@/lib/admin-format";
import StaffForm from "@/components/admin/StaffForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AdminTeamPage() {
  const admin = await requireAdmin("team");
  const members = await prisma.staffMember.findMany({ orderBy: [{ role: "asc" }, { email: "asc" }] });
  const owners = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-[#111110]">Team</h1>
      <p className="mt-1 text-sm text-stone-500">
        Who can use this admin panel, and which parts. Each person signs in at /admin/login with an account on their
        email. If they don&apos;t have one yet, they create it first at /register on the shop.
      </p>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900 mb-4">Add someone</h2>
        <StaffForm />
        <dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {ROLES.map((r) => (
            <div key={r.value} className="flex gap-2">
              <dt className="font-medium text-stone-900 shrink-0">{r.label}:</dt>
              <dd className="text-stone-500">{r.help}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ul className="mt-6 space-y-3">
        {owners.map((email) => (
          <li key={email} className="rounded-2xl border border-stone-200 bg-white px-5 py-4 flex flex-wrap items-center gap-3">
            <span className="font-medium text-stone-900">{email}</span>
            <span className="rounded-full bg-stone-900 text-white px-2.5 py-0.5 text-xs font-semibold">Owner</span>
            <span className="ml-auto text-xs text-stone-500">Set in ADMIN_EMAILS on the server</span>
          </li>
        ))}
        {members.map((m) => (
          <li key={m.email} className="rounded-2xl border border-stone-200 bg-white px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-stone-900">{m.email}</span>
              <span className="rounded-full bg-stone-100 text-stone-800 px-2.5 py-0.5 text-xs font-semibold">
                {roleLabel(m.role)}
              </span>
              <span className="ml-auto text-xs text-stone-500">
                Added {formatDate(m.createdAt)} by {m.addedBy}
              </span>
            </div>
            {m.email !== admin.email && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <StaffForm member={{ email: m.email, role: m.role }} />
                <form action={removeStaffMember}>
                  <input type="hidden" name="email" value={m.email} />
                  <ConfirmButton
                    message={`Remove ${m.email} from the team? They will lose admin access at once.`}
                    className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                  >
                    Remove
                  </ConfirmButton>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
