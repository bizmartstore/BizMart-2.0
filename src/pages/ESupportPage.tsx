"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Headset, ShieldCheck, Eye, MessageSquare, AlertTriangle } from "lucide-react";

export default function ESupportPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | undefined>("policies");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      {/* Hero Section */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 rounded-2xl p-6 border border-blue-200/50 shadow-sm">
          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            Your voice matters. You are safe here.
          </h1>
          <p className="text-sm text-muted-foreground">
            BizMart E-Support is here to help you report concerns confidentially and safely.
          </p>
        </div>
      </div>

      {/* E-Sumbong Card */}
      <div className="px-4 mt-4">
        <Card className="border border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Headset className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  E-Sumbong: Submit Confidential Reports
                </CardTitle>
                <CardDescription>
                  Submit confidential reports to guidance. Your safety is our priority.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Whether you're facing bullying, harassment, safety concerns, or need mental health support, we're here to listen and help.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/e-support/submit")}
                className="flex-1 h-12 font-bold rounded-xl gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Submit a Report
              </Button>

              <Button
                onClick={() => navigate("/e-support/track")}
                variant="outline"
                className="flex-1 h-12 font-bold rounded-xl gap-2"
              >
                <Eye className="h-4 w-4" />
                Track Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Section */}
      <div className="px-4 mt-4">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Anti-Bullying & Safety Policies
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
              <AccordionItem value="policies">
                <AccordionTrigger className="text-sm font-bold">
                  What is E-Sumbong?
                </AccordionTrigger>

                <AccordionContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    <strong>E-Sumbong</strong> is our confidential reporting system that allows you to safely report incidents such as:
                  </p>

                  <ul className="space-y-2 pl-4">
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Bullying or harassment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Misconduct by students or staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Safety threats or concerns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Discrimination or unfair treatment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Mental health concerns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Any other serious issues</span>
                    </li>
                  </ul>

                  <p>
                    Your report will be handled with the utmost confidentiality.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Notice */}
      <div className="px-4 mt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm">
            If you are in immediate danger, contact emergency services immediately.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}