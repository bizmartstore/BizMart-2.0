"use client";

import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, MessageSquare, Info, Heart, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ESupportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      
      <div className="px-4 py-6">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">BizMart E-Support</span>
            </div>
            <h1 className="text-2xl font-black mb-2">Your voice matters.</h1>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              A safe space for students to report concerns or talk to guidance counselors. You are safe here.
            </p>
          </div>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 gap-4">
          {/* E-Sumbong Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-foreground mb-1">E-Sumbong</h2>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Report bullying, harassment, or safety concerns. Choose to stay anonymous or identify yourself.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate("/e-sumbong")} size="sm" className="rounded-xl font-bold bg-red-600 hover:bg-red-700">
                    Submit a Report
                  </Button>
                  <Button onClick={() => navigate("/e-sumbong/track")} variant="outline" size="sm" className="rounded-xl font-bold">
                    Track Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* E-Kausap Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-foreground mb-1">E-Kausap</h2>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Talk directly to a guidance counselor. Get support for mental health or personal concerns.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate("/e-kausap")} size="sm" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                    Start Chat
                  </Button>
                  <Button onClick={() => navigate("/e-kausap/schedule")} variant="outline" size="sm" className="rounded-xl font-bold">
                    Schedule Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Section */}
        <div className="mt-8 bg-muted/30 rounded-2xl p-5 border border-dashed border-border">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Confidentiality & Safety</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>Privacy First:</strong> All reports and conversations are strictly confidential and handled only by authorized guidance personnel.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>Anti-Bullying Policy:</strong> We follow the school's strict anti-bullying guidelines to ensure a safe environment for everyone.
              </p>
            </div>
          </div>
          <Button variant="link" className="p-0 h-auto text-[10px] font-bold mt-4 text-primary">
            Read Full Support Policy <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}