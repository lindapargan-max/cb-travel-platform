import { useState } from "react";
import { Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PromoCodeInput({ onApply }: { onApply?: (code: string, discount: number) => void }) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const validatePromo = trpc.promoCodes.validate.useMutation({
    onSuccess: (result) => {
      if (result.valid) {
        setApplied(true);
        setAppliedCode(code);
        setDiscount(result.discount || 0);
        onApply?.(code, result.discount || 0);
        toast.success(`Great news! An extra £${result.discount?.toFixed(2)} will be taken off your total amount.`);
      } else {
        toast.error(result.message || "Invalid promo code");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleApply = () => {
    if (!code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    validatePromo.mutate({ code });
  };

  const handleRemove = () => {
    setApplied(false);
    setAppliedCode("");
    setDiscount(0);
    setCode("");
    onApply?.("", 0);
  };

  if (applied) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="text-green-600" size={20} />
            <div>
              <p className="font-semibold text-green-900">Promo Code Applied</p>
              <p className="text-sm text-green-700 font-mono">{appliedCode}</p>
              <p className="text-sm text-green-700">Save £{discount.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Promo Code (Optional)</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === "Enter" && handleApply()}
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={validatePromo.isPending}
          variant="outline"
        >
          {validatePromo.isPending ? "Checking..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}
