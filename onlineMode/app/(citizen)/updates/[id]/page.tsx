import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UpdateDetailView from "@/components/UpdateDetailView";
import { getOfficialUpdateById } from "@/app/actions/data";

export default async function UpdateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await getOfficialUpdateById(id);

  if (!update) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <UpdateDetailView update={update} />
      <Footer />
    </div>
  );
}
