import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outbreak | Citizen Dashboard - Real-time Emergency Response",
  description: "Access real-time disaster alerts, report damages, and request emergency assistance in your region.",
};

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
