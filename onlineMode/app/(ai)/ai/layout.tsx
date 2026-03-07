import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outbreak | AI Insights - Predictive Disaster Analysis",
  description: "AI-driven predictive modeling and anomaly detection for disaster management authorities and citizens.",
};

export default function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
