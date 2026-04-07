"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import { Download, X } from "lucide-react";
import bizMartLogo from "@/assets/bizmart-install-logo.png";

interface OrderReceiptProps {
  order: any;
  onClose: () => void;
}

export default function OrderReceipt({ order, onClose }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Safely parse items - handle both array and JSON string
  let items: any[] = [];
  if (order.items) {
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (typeof order.items === 'string') {
      try {
        items = JSON.parse(order.items);
      } catch (e) {
        console.error('Failed to parse order items as JSON string:', e);
        items = [];
      }
    } else {
      console.warn('Order items is not an array or string:', order.items);
      items = [];
    }
  }

  const isPrintOrder = order.type === 'print';
  const subtotal = isPrintOrder ? 0 : items.reduce((s: number, i: any) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `BizMart-Receipt-${order.id.slice(0, 8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Action buttons */}
        <div className="flex justify-between mb-3">
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform">
            <Download className="h-4 w-4" /> Save Receipt
          </button>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-card flex items-center justify-center shadow-lg">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt card */}
        <div ref={receiptRef} className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header gradient */}
          <div style={{ background: "linear-gradient(135deg, #f97316, #fb923c, #fdba74)" }} className="px-5 pt-6 pb-8 text-center relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <img src={bizMartLogo} alt="BizMart" className="h-14 mx-auto mb-2 drop-shadow-lg" />
            <p className="text-white/90 text-[10px] font-medium tracking-widest uppercase">Official Receipt</p>
          </div>

          {/* Zigzag divider */}
          <div className="relative -mt-3">
            <svg viewBox="0 0 400 20" className="w-full" preserveAspectRatio="none">
              <path d="M0,0 L10,15 L20,0 L30,15 L40,0 L50,15 L60,0 L70,15 L80,0 L90,15 L100,0 L110,15 L120,0 L130,15 L140,0 L150,15 L160,0 L170,15 L180,0 L190,15 L200,0 L210,15 L220,0 L230,15 L240,0 L250,15 L260,0 L270,15 L280,0 L290,15 L300,0 L310,15 L320,0 L330,15 L340,0 L350,15 L360,0 L370,15 L380,0 L390,15 L400,0 L400,20 L0,20 Z" fill="white" />
            </svg>
          </div>

          {/* Order info */}
          <div className="px-5 pt-1 pb-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Order No.</p>
                <p className="text-xs font-bold text-gray-800 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Date</p>
                <p className="text-xs font-bold text-gray-800">
                  {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Customer</p>
                <p className="text-xs font-bold text-gray-800">{order.customer_name || "Customer"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Time</p>
                <p className="text-xs font-bold text-gray-800">
                  {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {order.delivery_type && (
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Method</p>
                  <p className="text-xs font-bold text-gray-800">
                    {order.delivery_type === "delivery" ? "🚚 Delivery" : "📦 Pickup"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Schedule</p>
                  <p className="text-xs font-bold text-gray-800">{order.pickup_date} {order.pickup_time}</p>
                </div>
              </div>
            )}

            {/* Dashed line */}
            <div className="border-t-2 border-dashed border-gray-200 my-3" />

            {/* Items - Only show for product orders */}
            {!isPrintOrder && (
              <>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Items Purchased</p>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No items found in this order.</p>
                  ) : (
                    items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400">₱{Number(item.price).toFixed(2)} × {item.quantity}</p>
                        </div>
                        <p className="text-[11px] font-bold text-gray-800">₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Print order details */}
            {isPrintOrder && (
              <>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Print Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-800">File Name</span>
                    <span className="text-[11px] font-bold text-gray-800">{order.file_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-800">Total Pages</span>
                    <span className="text-[11px] font-bold text-gray-800">{order.total_pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-800">B&W Pages</span>
                    <span className="text-[11px] font-bold text-gray-800">{order.bw_pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-800">Color Pages</span>
                    <span className="text-[11px] font-bold text-gray-800">{order.colored_pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-800">Paper Size</span>
                    <span className="text-[11px] font-bold text-gray-800">{order.page_size === 'short' ? 'Short/A4' : 'Long (8.5x13)'}</span>
                  </div>
                </div>
              </>
            )}

            {/* Dashed line */}
            <div className="border-t-2 border-dashed border-gray-200 my-3" />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">Subtotal</span>
                <span className="text-[11px] font-semibold text-gray-700">₱{subtotal.toFixed(2)}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400">Delivery Fee</span>
                  <span className="text-[11px] font-semibold text-gray-700">₱{Number(order.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-800">TOTAL</span>
                <span className="text-lg font-extrabold" style={{ color: "#f97316" }}>₱{Number(order.total || order.cost || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* BCoins earned */}
            {order.bcoins_earned && Number(order.bcoins_earned) > 0 && (
              <div className="mt-3 rounded-xl p-2.5 text-center" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)" }}>
                <p className="text-[11px] font-bold" style={{ color: "#f97316" }}>
                  🪙 You earned {Number(order.bcoins_earned).toFixed(1)} BCoins!
                </p>
              </div>
            )}

            {/* Status badge */}
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                ✅ Payment Confirmed & Completed
              </span>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-medium">Thank you for shopping with BizMart! 🎉</p>
              <p className="text-[9px] text-gray-300 mt-1">shop-campus-learn.lovable.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}