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
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Your voice matters. You are safe here.</h1>
          <p className="text-sm text-muted-foreground">BizMart E-Support is here to help you report concerns confidentially and safely.</p>
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
                <CardTitle className="text-lg">E-Sumbong: Submit Confidential Reports</CardTitle>
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

      {/* Policy/Awareness Section */}
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
                      <span className="text-primary">•</span>
                      <span>Bullying or harassment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Misconduct by students or staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Safety threats or concerns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Discrimination or unfair treatment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Mental health concerns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Any other serious issues</span>
                    </li>
                  </ul>
                  <p>
                    Your report will be handled with the utmost confidentiality and care by our guidance counselors.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="confidentiality">
                <AccordionTrigger className="text-sm font-bold">
                  How is my privacy protected?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    <strong>Anonymous Reporting:</strong> You can choose to submit your report anonymously. When you report anonymously:
                  </p>
                  <ul className="space-y-2 pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>No personal information is stored</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>You receive a unique tracking ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>You can check your report status using the tracking ID</span>
                    </li>
                  </ul>
                  <p>
                    <strong>Identified Reporting:</strong> If you choose to identify yourself, your information is kept confidential and only accessible to guidance counselors.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="process">
                <AccordionTrigger className="text-sm font-bold">
                  What happens after I submit a report?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    <strong>Step 1:</strong> Your report is received by our guidance office
                  </p>
                  <p>
                    <strong>Step 2:</strong> A counselor reviews and assesses the report
                  </p>
                  <p>
                    <strong>Step 3:</strong> Appropriate action is taken based on the severity
                  </p>
                  <p>
                    <strong>Step 4:</strong> You receive updates on the status of your report
                  </p>
                  <p>
                    <strong>Step 5:</strong> Resolution and follow-up as needed
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    Most reports are addressed within 24-48 hours.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <div className="px-4 mt-4">
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-200 mb-1">Important Notice</h3>
            <p className="text-sm text-muted-foreground">
              If you are in immediate danger or need urgent help, please contact your school's emergency services or trusted adult immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Support Resources */}
      <div className="px-4 mt-4">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Support Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">Guidance Office Contact:</p>
              <p className="text-sm text-muted-foreground">📞 Phone: (02) 123-4567</p>
              <p className="text-sm text-muted-foreground">📧 Email: guidance@school.edu.ph</p>
              <p className="text-sm text-muted-foreground">📍 Location: Main Building, 2nd Floor</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">Emergency Contacts:</p>
              <p className="text-sm text-muted-foreground">🚨 Police: 911</p>
              <p className="text-sm text-muted-foreground">🏥 Hospital: 911</p>
              <p className="text-sm text-muted-foreground">📞 Crisis Hotline: 800-123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}