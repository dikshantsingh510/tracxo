import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect("/workspaces");
}
