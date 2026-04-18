import { trpc } from "../lib/trpc";

export default function QRCodeDisplay({ bookingId }: { bookingId: number }) {
  const { data } = trpc.qr.generate.useQuery({ bookingId });

  if (!data?.dataUrl) return null;

  const download = () => {
    const a = document.createElement('a');
    a.href = data.dataUrl;
    a.download = `booking-${bookingId}-qr.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Booking QR Code</p>
      <img src={data.dataUrl} alt="Booking QR Code" className="w-32 h-32 rounded-lg shadow" />
      <button onClick={download} className="text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg hover:bg-[#2d5986] transition-colors">
        ⬇️ Download PNG
      </button>
    </div>
  );
}
