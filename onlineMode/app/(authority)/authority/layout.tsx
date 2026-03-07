import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outbreak | Authority Command Center - Crisis Management",
  description: "State-of-the-art disaster management dashboard for government authorities and emergency responders.",
};

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
