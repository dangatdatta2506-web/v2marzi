import { MessageCircle } from "lucide-react";

export const WHATSAPP_NUMBER = "918788011561";

export function whatsappLink(message = "Hi Marzi! I'd love some help choosing a piece.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Marzi on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-6" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}
