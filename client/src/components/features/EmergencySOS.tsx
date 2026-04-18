import { useState } from "react";
import { AlertCircle, Phone, MapPin, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function EmergencySOS({ destination }: { destination?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const emergencyQuery = trpc.emergency.getEmergencyInfo.useQuery(
    { destination: destination || "Thailand" },
    { enabled: isOpen }
  );

  const info = emergencyQuery.data;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg animate-pulse z-40"
        title="Emergency SOS"
      >
        <AlertCircle size={24} />
      </button>

      {isOpen && info && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-6 max-w-sm z-40 border-2 border-red-600">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-red-600">Emergency Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-red-600" />
                <div>
                  <p className="font-semibold">Police</p>
                  <p className="text-gray-600">{info.police}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-orange-600" />
                <div>
                  <p className="font-semibold">Ambulance</p>
                  <p className="text-gray-600">{info.ambulance}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <div>
                  <p className="font-semibold">{info.embassyName}</p>
                  <p className="text-gray-600 text-xs">{info.embassyAddress}</p>
                  <p className="text-blue-600 font-mono text-xs">{info.embassy}</p>
                </div>
              </div>
              <a
                href="https://wa.me/447495823953?text=I%20need%20emergency%20assistance%20with%20my%20booking"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <MessageCircle size={16} />
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
