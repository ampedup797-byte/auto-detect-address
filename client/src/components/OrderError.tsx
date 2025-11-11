import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface OrderErrorProps {
  message: string;
  onRetry: () => void;
}

export default function OrderError({ message, onRetry }: OrderErrorProps) {
  return (
    <Card
      className="p-8 bg-red-50 border-red-200"
      data-testid="card-order-error"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" data-testid="icon-error" />
        </div>

        <h3 className="text-xl font-semibold text-red-900 mb-2" data-testid="text-error-title">
          Order Creation Failed
        </h3>

        <p className="text-sm text-red-800 mb-6" data-testid="text-error-message">
          {message}
        </p>

        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
          data-testid="button-retry"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </Card>
  );
}
