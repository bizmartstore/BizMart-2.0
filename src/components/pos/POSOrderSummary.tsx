"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";

interface POSOrderSummaryProps {
  items: any[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  submitting: boolean;
}

export default function POSOrderSummary({ items, onRemove, onClear, onCheckout, submitting }: POSOrderSummaryProps) {
  const total = items.reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Order Summary ({items.length})</h3>
        <Button size="sm" variant="outline" onClick={onClear}>
          <Trash2 className="h-3 w-3 mr-1" /> Clear
        </Button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === 'print' ? <Printer className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-secondary" />}
                <div>
                  <p className="text-xs font-bold">
                    {item.type === 'print' ? 'Print' : 'Photocopy'}
                    {item.customerName && ` - ${item.customerName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.pageCount} pages • {item.pageSize.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">₱{item.cost.toFixed(2)}</p>
                <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">Total</span>
          <span className="text-2xl font-extrabold text-primary">₱{total.toFixed(2)}</span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={items.length === 0 || submitting}
          className="w-full h-12 font-bold rounded-xl gap-2"
        >
          {submitting ? 'Processing...' : 'Checkout All'}
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
