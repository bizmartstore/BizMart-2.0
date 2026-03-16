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
  return /FBAN|FBAV|FB_IAB|FB4A|FB4M|Messenger|Instagram|Line|MicroMessenger|Snapchat|TikTok/i.test(ua);
}

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /FBAN|FBAV|FB_IAB|FB4A|FB4M|Messenger|Instagram|Line|MicroMessenger|Snapchat|TikTok/i.test(ua);
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
    } else {
      setInstalled(false);
    }
    if (isInAppBrowser()) {
      setInAppBrowser(true);
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

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-y-auto">
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
              To install BizMart, open this site in <strong className="text-foreground">Chrome</strong> or <strong className="text-foreground">Safari</strong> and tap "Add to Home Screen" from the browser menu.
            </p>

            <button
              onClick={handleCopyAndInstall}
              className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-bold text-sm py-4 px-6 rounded-2xl shadow-lg active:scale-[0.97] transition-all disabled:opacity-60"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Install App                </>
              )}
            </button>

            {!copied && (
              <p className="text-[10px] text-muted-foreground">
                Tap the button above to copy the link, then paste it in Chrome or Safari
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              To install BizMart, open this site in <strong className="text-foreground">Chrome</strong> or <strong className="text-foreground">Safari</strong> and tap "Add to Home Screen" from the browser menu.
            </p>

            {!showManualGuide && (
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

            {showManualGuide && (
              <div className="w-full bg-card border border-border rounded-2xl p-5 text-left space-y-4">
                <p className="font-bold text-sm text-foreground">How to install on Android:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MoreVertical className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 1</p>
                      <p className="text-[11px] text-muted-foreground">Tap the <strong>⋮ menu</strong> at the top-right of Chrome</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Step 2</p>
                      <p className="text-[11px] text-muted-foreground">Tap <strong>"Add to Home screen"</strong></p>
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

            <button
              onClick={() => setShowManualGuide(false)}
              className="w-full text-xs text-primary font-bold py-2"
            >
              ← Try automatic install again
            </button>
          </div>
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