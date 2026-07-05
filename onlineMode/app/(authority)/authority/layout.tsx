import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Outbreak | Authority Command Center - Crisis Management",
  description: "State-of-the-art disaster management dashboard for government authorities and emergency responders.",
};

export default async function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Middleware only checks JWT metadata; re-verify the role against the
  // profiles table here so a stale/tampered metadata claim can't grant
  // access to the command center.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "authority" && profile?.role !== "community_supporter") {
    redirect("/");
  }

  return <>{children}</>;
}
