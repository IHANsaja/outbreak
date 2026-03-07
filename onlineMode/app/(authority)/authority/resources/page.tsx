"use client";
import React, { useState } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Plus, Package, Truck, Calendar, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import NewShipmentModal from "@/components/NewShipmentModal";

export default function ResourcesPage() {
  const { showToast } = useToast();
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);

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
           <ResourceCard 
             title="Medical Kits"
             subtitle="Essential First Aid"
             stock="450 Units"
             demand="1,200 Units"
             status="Critical"
             icon={<Package className="w-6 h-6 text-blue-500" />}
             iconBg="bg-blue-50"
             chartColor="bg-red-400"
           />
           <ResourceCard 
             title="Food Rations"
             subtitle="MREs & Dry Goods"
             stock="8,500 Packs"
             demand="6,000 Packs"
             status="Stable"
             icon={<Truck className="w-6 h-6 text-orange-500" />}
             iconBg="bg-orange-50"
             chartColor="bg-orange-400"
           />
           <ResourceCard 
             title="Water Tanks"
             subtitle="Potable Water"
             stock="45 Tanks"
             demand="60 Tanks"
             status="Low"
             icon={<Package className="w-6 h-6 text-cyan-500" />}
             iconBg="bg-cyan-50"
             chartColor="bg-cyan-400"
           />
           <ResourceCard 
             title="Rescue Vehicles"
             subtitle="Ambulance & Trucks"
             stock="24 Units"
             demand="8 Missions"
             status="Available"
             icon={<Truck className="w-6 h-6 text-slate-500" />}
             iconBg="bg-slate-50"
             chartColor="bg-slate-700"
             isVehicle={true}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
           {/* Recent Dispatches */}
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Dispatches</h3>
                 <button onClick={() => showToast("Opening Complete Logistics Log", "info")} className="text-auth-accent-red text-xs font-bold uppercase tracking-widest hover:underline">View All Log</button>
              </div>

              <div className="space-y-6">
                 <DispatchRow id="#402" item="Medical Kit" dest="Galle Gen. Hospital" status="In Transit" time="12 mins ago" />
                 <DispatchRow id="Batch A" item="Food Supply" dest="Kalutara Relief Camp" status="Delivered" time="1 hour ago" />
                 <DispatchRow id="#401" item="Water Tank Truck" dest="Matara Zone 2" status="Preparing" time="2 hours ago" />
              </div>
           </div>

           {/* Supply Chain Alerts */}
           <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight px-2">Supply Chain Alerts</h3>
              
              <div 
                onClick={() => showToast("Resolving Stock Alert: Galle District", "warning")}
                className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4 cursor-pointer hover:bg-red-100/50 transition-colors"
              >
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-red-900">Low Medical Stock</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">Galle district reports less than 24 hours of antibiotics remaining. Immediate resupply advised.</p>
                 </div>
              </div>

              <div 
                onClick={() => showToast("Re-routing convoy #SHP-99...", "info")}
                className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4 cursor-pointer hover:bg-orange-100/50 transition-colors"
              >
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
                    <Truck className="w-5 h-5 text-orange-500" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-orange-900">Transport Delay</h4>
                    <p className="text-xs text-orange-700 mt-1 leading-relaxed">Main highway to Central province blocked by landslide. Re-routing supply convoys +2 hours ETA.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <NewShipmentModal 
        isOpen={isShipmentModalOpen} 
        onClose={() => setIsShipmentModalOpen(false)} 
      />
    </AuthorityLayout>
  );
}

function ResourceCard({ title, subtitle, stock, demand, status, icon, iconBg, chartColor, isVehicle = false }: any) {
  const { showToast } = useToast();
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = () => {
    setIsDispatching(true);
    showToast(`Initiating Dispatch: ${title}`, "info");
    
    setTimeout(() => {
      setIsDispatching(false);
      showToast(`${title} successfully dispatched to Northern Buffer Zone.`, "success");
    }, 2500);
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow group hover:border-auth-accent-red/20 transition-all duration-300">
       <div className="flex gap-6">
          <div className="flex-1 space-y-6">
             <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center border border-auth-border/50 shadow-sm`}>
                   {icon}
                </div>
                <div>
                   <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h4>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        status === 'Critical' ? 'bg-red-500 text-white' :
                        status === 'Low' ? 'bg-yellow-100 text-yellow-700' :
                        status === 'Stable' ? 'bg-green-100 text-green-700' :
                        'bg-green-500 text-white'
                      }`}>{status}</span>
                   </div>
                   <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stock</p>
                   <p className="text-lg font-bold text-slate-900 mt-1">{stock}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVehicle ? "Active Requests" : "Estimated Demand"}</p>
                   <p className="text-lg font-bold text-auth-accent-red mt-1">{demand}</p>
                </div>
             </div>

             <button 
                disabled={isDispatching}
                onClick={handleDispatch}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 py-3 rounded-xl border border-slate-200 text-sm font-bold transition-all active:scale-95"
             >
                {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isDispatching ? "Processing Dispatch..." : "Dispatch Resource"}
             </button>
          </div>

          {/* Vertical Bar Chart Mock */}
          <div className="w-40 bg-slate-50/50 rounded-2xl flex flex-col justify-end p-4 border border-slate-100 group-hover:bg-slate-50 transition-colors">
             <div className="flex justify-around items-end h-32 gap-3">
                <div className={`w-12 bg-blue-500 rounded-t-lg transition-all duration-1000 delay-100 group-hover:brightness-110`} style={{ height: '60%' }}></div>
                <div className={`w-12 ${chartColor} rounded-t-lg transition-all duration-1000 delay-300 relative group-hover:brightness-110`} style={{ height: '85%' }}>
                   <div className="absolute -top-1 left-0 right-0 border-t-2 border-dashed border-red-500"></div>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-3">Stock vs Demand</p>
          </div>
       </div>
    </div>
  );
}

function DispatchRow({ id, item, dest, status, time }: any) {
  const { showToast } = useToast();
  return (
    <div 
      onClick={() => showToast(`Tracking Shipment ${id}: ${item}`, "info")}
      className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
    >
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-auth-accent-red transition-all shadow-sm">
             <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <div>
             <h4 className="text-sm font-bold text-slate-900 group-hover:text-auth-accent-red transition-colors">{item} {id}</h4>
             <p className="text-xs text-slate-400">{dest}</p>
          </div>
       </div>
       <div className="flex items-center gap-8 text-right">
          <div>
             <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
               status === 'In Transit' ? 'bg-yellow-50 text-yellow-600' :
               status === 'Delivered' ? 'bg-green-50 text-green-600' :
               'bg-slate-50 text-slate-400'
             }`}>{status}</span>
          </div>
          <div className="w-24">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{time}</span>
          </div>
       </div>
    </div>
  );
}
