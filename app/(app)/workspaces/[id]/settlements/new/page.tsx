import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getUserUpiVpa } from "@/lib/queries/settlements";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SettlementForm } from "./settlement-form";

export const metadata = { title: "Record settlement · Tracxo" };

export default async function NewSettlementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; amount?: string; currency?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession(`/workspaces/${id}/settlements/new`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const members = await getWorkspaceMembers(workspace.id);
  const presetTo = sp.to ?? "";
  // Pre-fetch the recipient's UPI VPA when we know who they are. This drives
  // whether the form shows the "Open UPI app" deep-link button.
  const presetToUpi = presetTo ? await getUserUpiVpa(presetTo) : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/balances`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Balances
      </Link>
      <AuthCard title="Record settlement" description="Mark a payment that already happened.">
        <SettlementForm
          workspaceId={workspace.id}
          workspaceCurrency={workspace.defaultCurrency}
          actorUserId={session.user.id}
          members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email }))}
          preset={{
            fromUserId: sp.from ?? session.user.id,
            toUserId: presetTo || (members[0]?.userId ?? ""),
            amountDecimal: sp.amount ?? "",
            currency: sp.currency ?? workspace.defaultCurrency,
          }}
          recipientUpiVpa={presetToUpi}
        />
      </AuthCard>
    </div>
  );
}
