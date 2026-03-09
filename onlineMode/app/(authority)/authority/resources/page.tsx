"use client";
import React, { useState, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Plus, Package, Truck, Calendar, AlertTriangle, ChevronRight, Loader2, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import NewShipmentModal from "@/components/NewShipmentModal";
import { getResources, updateResourceStock, deleteResource } from "@/app/actions/data";
import { cn } from "@/lib/utils";

export default function ResourcesPage() {
  const { showToast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);

  async function fetchResources() {
    setLoading(true);
    try {
      const data = await getResources();
      setResources(data);
    } catch (err) {
      showToast("Failed to fetch resources", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, []);

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Authority Resource Management</h1>
            <p className="text-slate-500 mt-1">Inventory management and essential supply status.</p>
          </div>
          <button 
            onClick={() => setIsShipmentModalOpen(true)}
            className="bg-auth-accent-red hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            <Plus className="w-5 h-5" />
            New Shipment
          </button>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {loading ? (
             [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[32px] border border-auth-border" />)
           ) : resources.length > 0 ? (
             resources.map((resource) => (
               <ResourceCard 
                 key={resource.id}
                 resource={resource}
                 onUpdate={() => fetchResources()}
               />
             ))
           ) : (
             <div className="lg:col-span-2 py-20 text-center opacity-30 font-bold uppercase">No resources found</div>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
           {/* Recent Dispatches - Keeping static for now as per user request focus on management */}
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Dispatch Logs</h3>
                 <button className="text-auth-accent-red text-xs font-bold uppercase tracking-widest hover:underline">View All Log</button>
              </div>
              <div className="space-y-6">
                 <p className="text-slate-400 text-sm italic">Historical logs are being migrated to the new system.</p>
              </div>
           </div>

           {/* Supply Chain Alerts - Dynamic based on stock level */}
           <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight px-2">System Alerts</h3>
              {resources.filter(r => r.status === 'critical').map(r => (
                <div key={r.id} className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Critical: {r.name}</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">Levels reaching critical in {r.regions?.name}. Immediate resupply advised.</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
      <NewShipmentModal 
        isOpen={isShipmentModalOpen} 
        onClose={() => { setIsShipmentModalOpen(false); fetchResources(); }} 
      />
    </AuthorityLayout>
  );
}

function ResourceCard({ resource, onUpdate }: { resource: any, onUpdate: () => void }) {
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateStock = async () => {
    const newQty = prompt("Enter new quantity:", resource.quantity.toString());
    if (newQty === null || isNaN(Number(newQty))) return;
    
    setIsUpdating(true);
    try {
      const qty = Number(newQty);
      const status = qty < 50 ? 'critical' : qty < 200 ? 'low' : 'available';
      await updateResourceStock(resource.id, qty, status);
      showToast("Stock updated successfully", "success");
      onUpdate();
    } catch (err) {
      showToast("Failed to update stock", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${resource.name} from inventory?`)) return;
    setIsDeleting(true);
    try {
      await deleteResource(resource.id);
      showToast("Resource removed", "success");
      onUpdate();
    } catch (err) {
      showToast("Failed to delete resource", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow group hover:border-auth-accent-red/20 transition-all duration-300">
       <div className="flex gap-6">
          <div className="flex-1 space-y-6">
             <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-auth-border/50 shadow-sm transition-transform group-hover:scale-105", 
                  resource.rtype === 'medical' ? 'bg-blue-50' : 'bg-orange-50')}>
                   {resource.rtype === 'medical' ? <Package className="w-6 h-6 text-blue-500" /> : <Truck className="w-6 h-6 text-orange-500" />}
                </div>
                <div>
                   <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-slate-900 tracking-tight">{resource.name}</h4>
                      <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                        resource.status === 'critical' ? 'bg-red-500 text-white' :
                        resource.status === 'low' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      )}>{resource.status}</span>
                   </div>
                   <p className="text-xs text-slate-400 font-medium">Located: {resource.regions?.name || "Global Hub"}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory</p>
                   <p className="text-lg font-bold text-slate-900 mt-1">{resource.quantity} {resource.unit}</p>
                </div>
                <div className="flex flex-col items-end">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                   <p className="text-xs font-bold text-slate-500 mt-1 uppercase">{resource.rtype}</p>
                </div>
             </div>

             <div className="flex gap-3">
               <button 
                  disabled={isUpdating}
                  onClick={handleUpdateStock}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 py-3 rounded-xl border border-slate-200 text-sm font-bold transition-all active:scale-95"
               >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Update Stock
               </button>
               <button 
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="w-12 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-all active:scale-95"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
             </div>
          </div>

          <div className="w-40 bg-slate-50/50 rounded-2xl flex flex-col justify-end p-4 border border-slate-100">
             <div className="flex justify-around items-end h-32 gap-3">
                <div className="w-12 bg-blue-500 rounded-t-lg transition-all" style={{ height: `${Math.min(100, (resource.quantity / 1000) * 100)}%` }}></div>
                <div className="w-12 bg-slate-200 rounded-t-lg h-full overflow-hidden relative">
                   <div className="absolute bottom-0 w-full bg-slate-300" style={{ height: '70%' }}></div>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-3">Utilization</p>
          </div>
       </div>
    </div>
  );
}
