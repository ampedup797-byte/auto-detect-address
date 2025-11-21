import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ExternalLink, RefreshCw } from "lucide-react";

const WHATSAPP_LINK_BASE =
  "https://wa.me/917286877842?text=Hi%20MODEVO,%20I%20want%20to%20track%20my%20order%20"; 
// replace 918XXXXXXXXX with your real WhatsApp number
interface OrderSuccessProps {
  orderId: string;
  shopifyUrl?: string;
  onCreateAnother: () => void;
}

export default function OrderSuccess({
  orderId,
  shopifyUrl,
  onCreateAnother,
}: OrderSuccessProps) {
  return (
    <Card
      className="p-8 bg-green-50 border-green-200"
      data-testid="card-order-success"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" data-testid="icon-success" />
        </div>

        <h3 className="text-xl font-semibold text-green-900 mb-2" data-testid="text-success-title">
          Order Confirmed Successfully!
        </h3>

        <p className="text-sm text-green-800 mb-6" data-testid="text-success-message">
          THANK YOUR ORDER CONFIRMED🎉
          YOU CAN TRACK YOUR ORDER OR CHAT WHTH 
          US ON WHATSAPP IF YOU HAVE ANY QUESTIONS
          
        </p>

        <div className="bg-white rounded-md p-4 mb-6 border border-green-200">
          <p className="text-sm text-green-800 mb-1">Order ID</p>
          <p className="text-lg font-mono font-semibold text-green-900" data-testid="text-order-id">
            {orderId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {shopifyUrl && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(shopifyUrl, '_blank')}
              data-testid="button-view-shopify"
            >
              <ExternalLink className="h-4 w-4" />
              Track your order
            </Button>
          )}
          <Button
            onClick={onCreateAnother}
            className="gap-2"
            data-testid="button-create-another"
          >
            <RefreshCw className="h-4 w-4" />
              close
          </Button>
        </div>
      </div>
    </Card>
  );
}
