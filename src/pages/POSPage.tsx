"use client";

import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import POSContent from "@/components/pos/POSContent";

export default function POSPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="px-4 py-4">
        <POSContent />
      </div>
      <BottomNav />
    </div>
  );
}