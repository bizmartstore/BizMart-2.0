import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BizMartATMCard() {
  return (
    <Card
      className={cn(
        "relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl",
        "bg-[url('https://i.ibb.co/Q7L6H77G/ATM-BG.png')] bg-cover bg-center",
      )}
    >
      {/* Logo overlay */}
      <div className="absolute top-4 left-4">
        <img
          src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png"
          alt="BizMart Logo"
          className="h-12 w-auto"
        />
      </div>
      {/* Content placeholder */}
      <div className="p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">BizMart ATM</h2>
        <p className="text-sm">Your one-stop for BCoins and GCash transactions.</p>
      </div>
    </Card>
  );
}
