import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PromoCodeAdmin() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("50");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const promoCodes = trpc.promoCodes.list.useQuery();
  const createPromo = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      setCode("");
      setDiscount("50");
      setDescription("");
      setExpiresAt("");
      toast.success("Promo code created!");
      promoCodes.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deletePromo = trpc.promoCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("Promo code deleted!");
      promoCodes.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) {
      toast.error("Code and discount are required");
      return;
    }
    createPromo.mutate({
      code,
      discountAmount: parseFloat(discount),
      description,
      expiresAt,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold text-lg mb-4">Create New Promo Code</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input
                placeholder="e.g., SUMMER50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Discount (£)</Label>
              <Input
                type="number"
                placeholder="50"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              placeholder="e.g., Summer sale promotion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Expires At (optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createPromo.isPending} className="w-full">
            <Plus size={18} className="mr-2" />
            Create Promo Code
          </Button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold text-lg mb-4">Active Promo Codes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Code</th>
                <th className="text-left py-2">Discount</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.data?.map((promo) => (
                <tr key={promo.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-mono font-bold">{promo.code}</td>
                  <td className="py-3">£{promo.discountAmount}</td>
                  <td className="py-3 text-gray-600">{promo.description}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${promo.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => deletePromo.mutate(promo.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
