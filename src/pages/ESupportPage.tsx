import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Headset, ShieldCheck, Eye, MessageSquare, AlertTriangle, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Enhanced Report Status Component
const ReportStatus = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50", label: "Pending Review" },
    investigating: { icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50", label: "Under Investigation" },
    resolved: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", label: "Resolved" },
    escalated: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", label: "Escalated" },
    rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Rejected" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} border border-${status}-200`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
    </div>
  );
};

// Enhanced Hero Section Component
const HeroSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 pt-4"
    >
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 rounded-3xl p-6 border border-blue-200/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
              <Headset className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-1">
                Your voice matters. You are safe here.
              </h1>
              <p className="text-sm text-muted-foreground">
                BizMart E-Support is here to help you report concerns confidentially and safely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced E-Sumbong Card Component
const ESumbongCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="px-4 mt-4"
    >
      <Card className="border border-border shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1">
          <CardHeader className="bg-white dark:bg-gray-900 rounded-t-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                <Headset className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-extrabold text-foreground">
                  E-Sumbong: Submit Confidential Reports
                </CardTitle>
                <CardDescription className="text-sm">
                  Submit confidential reports to guidance. Your safety is our priority.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-6 space-y-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            Whether you're facing bullying, harassment, safety concerns, or need mental health support, we're here to listen and help.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex gap-3"
          >
            <Button
              onClick={() => navigate("/e-support/submit")}
              className="flex-1 h-14 font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              Submit a Report
            </Button>

            <Button
              onClick={() => navigate("/e-support/track")}
              variant="outline"
              className="flex-1 h-14 font-bold rounded-xl gap-2 border-2"
            >
              <Eye className="h-5 w-5" />
              Track Report
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Policy Section Component
const PolicySection = () => {
  const [expanded, setExpanded] = useState<string | undefined>("policies");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="px-4 mt-4"
    >
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Anti-Bullying & Safety Policies
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
            <AccordionItem value="policies">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>What is E-Sumbong?</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="text-sm text-muted-foreground space-y-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <strong>E-Sumbong</strong> is our confidential reporting system that allows you to safely report incidents such as:
                </motion.p>

                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="space-y-2 pl-4"
                >
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Bullying or harassment</span>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Misconduct by students or staff</span>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Safety threats or concerns</span>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Discrimination or unfair treatment</span>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Mental health concerns</span>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>Any other serious issues</span>
                  </motion.li>
                </motion.ul>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  Your report will be handled with the utmost confidentiality.
                </motion.p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Notice Component
const NoticeComponent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      className="px-4 mt-4"
    >
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-base text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you are in immediate danger, contact emergency services or a trusted adult immediately.
            This form is for non-emergency reporting.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Quick Actions Component
const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="px-4 mt-6"
    >
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/e-support/submit")}
            variant="outline"
            className="h-12 rounded-xl gap-2 border-2 hover:scale-[1.02] transition-transform"
          >
            <MessageSquare className="h-4 w-4" />
            Submit Report
          </Button>
          <Button
            onClick={() => navigate("/e-support/track")}
            variant="outline"
            className="h-12 rounded-xl gap-2 border-2 hover:scale-[1.02] transition-transform"
          >
            <Eye className="h-4 w-4" />
            Track Report
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function ESupportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900/50 dark:to-gray-950 pb-20">
      <TopBar />

      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ChevronRight className="h-5 w-5 transform rotate-180" />
            </button>
            <h1 className="text-lg font-extrabold text-foreground">E-Support Center</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Hero Section */}
        <HeroSection />

        {/* E-Sumbong Card */}
        <ESumbongCard />

        {/* Policy Section */}
        <PolicySection />

        {/* Quick Actions */}
        <QuickActions />

        {/* Important Notice */}
        <NoticeComponent />
      </div>

      <BottomNav />
    </div>
  );
}