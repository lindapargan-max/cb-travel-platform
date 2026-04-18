import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface EmergencyInfo {
  destination?: string | null;
  bookingId: number;
  bookingRef?: string;
}

export default function SOSButton({ booking }: { booking: EmergencyInfo }) {
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const sosMutation = trpc.sos.trigger.useMutation({
    onSuccess: () => { setTriggered(true); toast.error("🆘 Emergency alert sent to CB Travel. Help is on the way."); },
    onError: () => toast.error("Failed to send SOS. Please call 999 or 112 immediately."),
  });

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-105 animate-pulse">
        🆘 Emergency SOS
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <span className="text-5xl">🆘</span>
              <h2 className="text-2xl font-bold text-red-600 mt-2">Emergency Information</h2>
              {booking.destination && <p className="text-slate-600">{booking.destination}</p>}
            </div>
            <div className="space-y-3 mb-6">
              <a href="tel:999" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3 hover:bg-red-100 transition-colors">
                <span className="text-2xl">🚨</span>
                <div><p className="font-bold text-red-700">UK Emergency</p><p className="text-sm text-red-600">Call 999</p></div>
              </a>
              <a href="tel:112" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3 hover:bg-red-100 transition-colors">
                <span className="text-2xl">🇪🇺</span>
                <div><p className="font-bold text-red-700">European Emergency</p><p className="text-sm text-red-600">Call 112</p></div>
              </a>
              <a href="https://wa.me/447534168295?text=SOS+Emergency+Help+Needed" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 hover:bg-green-100 transition-colors">
                <span className="text-2xl">💬</span>
                <div><p className="font-bold text-green-700">WhatsApp CB Travel</p><p className="text-sm text-green-600">07534 168295</p></div>
              </a>
              <a href="tel:+447534168295" className="flex items-center gap-3 bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl p-3 hover:bg-[#1e3a5f]/10 transition-colors">
                <span className="text-2xl">📞</span>
                <div><p className="font-bold text-[#1e3a5f]">CB Travel Emergency</p><p className="text-sm text-[#1e3a5f]/70">Tap to call 07534 168295</p></div>
              </a>
            </div>
            {!triggered ? (
              <button onClick={() => sosMutation.mutate({ bookingId: booking.bookingId })} disabled={sosMutation.isPending}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {sosMutation.isPending ? "Sending Alert..." : "📧 Alert CB Travel Now"}
              </button>
            ) : (
              <div className="text-center bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-bold text-red-700">✅ Alert Sent to CB Travel</p>
                <p className="text-sm text-red-600">We will contact you as soon as possible.</p>
              </div>
            )}
            <button onClick={() => setOpen(false)} className="w-full mt-3 text-slate-500 text-sm hover:text-slate-700">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
