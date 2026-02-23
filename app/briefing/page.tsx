"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlertCard from "@/components/AlertCard";
import EvacuationInstructions from "@/components/EvacuationInstructions";
import { WaterLevels, RoadStatus } from "@/components/SituationalOverview";
import { EventTimeline, LocalResponders, Downloads } from "@/components/SideActions";
import Image from "next/image";
import { Map as MapIcon, Maximize2 } from "lucide-react";

export default function BriefingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar type="briefing" />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <AlertCard 
              severity="severe"
              title="FLOOD WARNING: Kalutara District"
              description="Kalu Ganga water levels have breached critical safety thresholds. Immediate evacuation is mandatory for residents in low-lying zones outlined below."
              updatedTime="10 mins ago"
              impactLevel="High"
            />
            
            <EvacuationInstructions 
              instructions={[
                {
                  step: 1,
                  title: "Immediate Action Required",
                  description: "Residents within 500m of the river bank must evacuate immediately to designated safe centers."
                },
                {
                  step: 2,
                  title: "What to Pack",
                  description: "Bring only essential documents, medication, and dry food for 24 hours. Do not carry heavy luggage."
                },
                {
                  step: 3,
                  title: "Utility Shutoff",
                  description: "Switch off main electricity and gas valves before leaving your premises."
                }
              ]}
              affectedAreas={["Palatota", "Nagoda West", "Dodangoda", "Tebuwana"]}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WaterLevels 
                gauges={[
                  { name: "Putupaula Gauge", level: "4.2m", maxLevel: "5m", status: "Flood Level", percentage: 84 },
                  { name: "Millakanda Gauge", level: "8.1m", maxLevel: "9m", status: "Major Flood", percentage: 90 }
                ]}
              />
              <RoadStatus 
                roads={[
                  { name: "Kalutara - Mathugama Main Rd", detail: "Inaccessible near Dodangoda junction", status: "restricted" },
                  { name: "Nagoda By-road", detail: "Submerged (2ft water)", status: "submerged" },
                  { name: "Highway Entrance (Dodangoda)", detail: "Open for emergency vehicles only", status: "open" }
                ]}
              />
            </div>
            
            <EventTimeline 
              events={[
                {
                  id: "1",
                  title: "Evacuation Order Issued",
                  description: "District Secretariat issues mandatory evacuation for riverside GN divisions.",
                  time: "10:45 AM",
                  date: "Today",
                  status: "new"
                },
                {
                  id: "2",
                  title: "Water Level Reaches Major Flood Level",
                  description: "Millakanda gauge records 8.0m.",
                  time: "08:30 AM",
                  date: "Today",
                  status: "past"
                },
                {
                  id: "3",
                  title: "Heavy Rainfall Alert",
                  description: "Meteorology Department predicts >150mm rainfall in catchment areas.",
                  time: "11:00 PM",
                  date: "Yesterday",
                  status: "past"
                }
              ]}
            />
          </div>
          
          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Impact Zone Map */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-zinc-900 italic uppercase tracking-wider text-xs">Impact Zone Map</h3>
              <div className="relative rounded-xl overflow-hidden aspect-square md:aspect-video lg:aspect-square bg-blue-50">
                 {/* Mock Map Image */}
                 <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/80.0,6.5,12,0/600x600?access_token=pk.eyJ1IjoiYm9vdGciLCJhIjoiY2toZ3p4Z3p4MDZ6eDJ4bzR4Z3p4Z3p4ZSJ9.0')] bg-cover bg-center" />
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-brand-red/10 border-2 border-brand-red/30 animate-pulse flex items-center justify-center">
                       <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center shadow-lg">
                          <MapIcon className="w-4 h-4 text-white" />
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-4 left-4 right-4">
                   <button className="w-full bg-white/90 backdrop-blur-sm text-zinc-900 border border-gray-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-lg hover:bg-white transition-all active:scale-95">
                      <Maximize2 className="w-4 h-4" />
                      View Interactive Map
                   </button>
                 </div>
              </div>
            </div>
            
            <LocalResponders 
              responders={[
                { name: "Kalutara District Secretariat", type: "Coordination Center", phone: "117" },
                { name: "Navy Rescue Unit", type: "Boat Service", phone: "119" },
                { name: "Area Police Station", type: "Nagoda Division", phone: "119" }
              ]}
            />
            
            <Downloads />
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
