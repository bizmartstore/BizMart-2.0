import { useState, useEffect } from "react";
import { Download, Smartphone, Share, Plus, CheckCircle, MoreVertical } from "lucide-react";
import bizMartLogo from "@/assets/bizmart-install-logo.png";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram|Line|MicroMessenger|Snapchat|TikTok/i.test(ua);
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export default function PWAInstallGate({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setInstalled(false);
    if (isInAppBrowser()) {
      setInAppBrowser(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPromptReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
      // Clear dismissed announcement so it shows fresh after install
      localStorage.removeItem('dismissed_announcement');
    });
    return () => { window.removeEventListener("beforeinstallprompt", handler); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
      } catch (err) {
        console.warn("Install prompt failed:", err);
        // Show manual guide as fallback
        setShowManualGuide(true);
      }
      setDeferredPrompt(null);
      setPromptReady(false);
      setInstalling(false);
    } else {
      // No deferred prompt available - show manual guide
      setShowManualGuide(true);
    }
  };

  const handleCopyAndInstall = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.origin;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    }
  };

  if (installed) return <>{children}</>;

  const showIOSGuide = showManualGuide && isIOS();
  const showAndroidGuide = showManualGuide && !isIOS();

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm py-8">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl mb-6 border-2 border-primary/20">
          <img src={bizMartLogo} alt="BizMart" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-2">Install BizMart</h1>

        {inAppBrowser ? (
          <div className="w-full space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To install BizMart, you need to open it in <strong className="text-foreground">Google Chrome</strong> or <strong className="text-foreground">Safari</strong>.
            </p>

            <button
              onClick={handleCopyAndInstall}
              className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-bold text-sm py-4 px-6 rounded-2xl shadow-lg active:scale-[0.97] transition-all"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Install App
                </>
              )}
            </button>

            {copied && (
              <div className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Link copied to clipboard! ✅</p>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                  Now open <strong>Google Chrome</strong> or <strong>Safari</strong>, paste the link in the address bar, and tap <strong>"Install App"</strong> to add BizMart to your home screen.
                </p>
              </div>
            )}

            {!copied && (
              <p className="text-[10px] text-muted-foreground">
                Tap the button above to copy the link, then paste it in Chrome or Safari
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Install BizMart on your device for the best shopping experience. It's fast, works offline, and feels like a real app!
            </p>

            {!showManualGuide && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-bold text-sm py-4 px-6 rounded-2xl shadow-lg active:scale-[0.97] transition-all disabled:opacity-60"
              >
                {installing ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                {installing ? "Installing..." : "Install App"}
              </button>
            )}

            {/* iOS Manual Guide */}
            {showIOSGuide && (
              <div className="w-full bg-card border border-border rounded-2xl p-5 text-left space-y-4">
                <p className="font-bold text-sm text-foreground">How to install on iPhone/iPad:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Share className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 1</p>
                      <p className="text-[11px] text-muted-foreground">Tap the <strong>Share</strong> button at the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 2</p>
                      <p className="text-[11px] text-muted-foreground">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 3</p>
                      <p className="text-[11px] text-muted-foreground">Tap <strong>"Add"</strong> — BizMart will appear on your home screen!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Android Manual Guide */}
            {showAndroidGuide && (
              <div className="w-full bg-card border border-border rounded-2xl p-5 text-left space-y-4">
                <p className="font-bold text-sm text-foreground">How to install on Android:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MoreVertical className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 1</p>
                      <p className="text-[11px] text-muted-foreground">Tap the <strong>⋮ menu</strong> (three dots) at the top-right of Chrome</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 2</p>
                      <p className="text-[11px] text-muted-foreground">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 3</p>
                      <p className="text-[11px] text-muted-foreground">Tap <strong>"Install"</strong> — BizMart will appear on your home screen!</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualGuide(false)}
                  className="w-full text-xs text-primary font-bold py-2"
                >
                  ← Try automatic install again
                </button>
              </div>
            )}
          </>
        )}

        <p className="text-[10px] text-muted-foreground mt-6">
          🔒 No app store needed · Free · Lightweight
        </p>

        <div className="mt-4 pt-4 border-t border-border w-full text-center">
          <p className="text-[10px] text-muted-foreground">Developed by</p>
          <p className="text-xs font-bold text-foreground">JOEY ALBERT AGNAS</p>
          <p className="text-[10px] text-muted-foreground italic">BizMart Adviser</p>
        </div>
      </div>
    </div>
  );
}