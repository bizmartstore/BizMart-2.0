"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Headset, ShieldCheck, Eye, MessageSquare, AlertTriangle, ChevronRight, CheckCircle2, Clock, Shield, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function ESupportPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | undefined>("policies");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-blue-900/30">
      <TopBar />

      {/* Hero Section with Enhanced Design */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-900/60" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Headset className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold mb-2">
                  Your voice matters. <span className="text-blue-200">You are safe here.</span>
                </h1>
                <p className="text-blue-100 text-sm">
                  BizMart E-Support is here to help you report concerns confidentially and safely.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* E-Sumbong Card with Enhanced Design */}
      <div className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-blue-950/20 border border-blue-200/50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Headset className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold">
                    E-Sumbong: Submit Confidential Reports
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Submit confidential reports to guidance. Your safety is our priority.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Whether you're facing bullying, harassment, safety concerns, or need mental health support, we're here to listen and help.
                <br />
                <span className="font-bold text-blue-600 dark:text-blue-300">All reports are handled with strict confidentiality.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  onClick={() => navigate("/e-support/submit")}
                  className="flex-1 h-14 font-bold rounded-xl gap-2 text-lg shadow-lg hover:shadow-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Submit a Report</span>
                </Button>

                <Button
                  onClick={() => navigate("/e-support/track")}
                  variant="outline"
                  className="flex-1 h-14 font-bold rounded-xl gap-2 text-lg border-2 border-blue-200 hover:border-blue-300 transition-all"
                >
                  <Eye className="h-5 w-4" />
                  <span>Track Report</span>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Policy Section with Enhanced Design */}
      <div className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-blue-950/20 border border-blue-200/50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Anti-Bullying & Safety Policies
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
                <AccordionItem value="policies">
                  <AccordionTrigger className="text-sm font-bold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>What is E-Sumbong?</span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="text-sm text-muted-foreground space-y-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-3"
                    >
                      <p>
                        <strong>E-Sumbong</strong> is our confidential reporting system that allows you to safely report incidents such as:
                      </p>

                      <div className="space-y-3 pl-2">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                        >
                          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Bullying or harassment</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">Physical, verbal, or online bullying</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                        >
                          <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Misconduct</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">Inappropriate behavior by students or staff</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 }}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                        >
                          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Safety Concerns</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">Threats, violence, or dangerous situations</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 }}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                        >
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Discrimination</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">Racism, sexism, or unfair treatment</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1 }}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                        >
                          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Mental Health</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">Stress, anxiety, depression, or self-harm concerns</p>
                          </div>
                        </motion.div>
                      </div>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="pt-4 border-t border-blue-200 dark:border-blue-800 mt-4"
                      >
                        <strong>Your report will be handled with the utmost confidentiality.</strong> No one will know it was you unless you choose to share your identity.
                      </motion.p>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Important Notice with Enhanced Design */}
      <div className="px-4 mt-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200/50 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you are in immediate danger, contact emergency services immediately.
                  This form is for non-emergency reporting. Your safety is our top priority.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}