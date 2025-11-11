import { useState } from "react";
import OrderFormHeader from "@/components/OrderFormHeader";
import OrderForm, { type FormData } from "@/components/OrderForm";
import OrderSuccess from "@/components/OrderSuccess";
import OrderError from "@/components/OrderError";
import OrderFormFooter from "@/components/OrderFormFooter";
import { apiRequest } from "@/lib/queryClient";

type OrderState = "form" | "success" | "error";

export default function Home() {
  const [orderState, setOrderState] = useState<OrderState>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    console.log("Submitting order:", formData);

    try {
      const res = await apiRequest("POST", "/api/create-cod-order", formData);
      const response = await res.json() as any;

      if (response.success) {
        setOrderId(response.order_id || response.order_number || "N/A");
        setOrderState("success");
      } else {
        setErrorMessage(response.message || "Failed to create order");
        setOrderState("error");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setErrorMessage(error.message || "Unable to create order. Please check your connection and try again.");
      setOrderState("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setOrderState("form");
    setOrderId("");
    setErrorMessage("");
  };

  const handleRetry = () => {
    setOrderState("form");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OrderFormHeader />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {orderState === "form" && (
            <OrderForm onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {orderState === "success" && (
            <OrderSuccess
              orderId={orderId}
              shopifyUrl={`https://t1akyv-ss.myshopify.com/admin/orders/${orderId}`}
              onCreateAnother={handleCreateAnother}
            />
          )}

          {orderState === "error" && (
            <OrderError message={errorMessage} onRetry={handleRetry} />
          )}
        </div>
      </main>

      <OrderFormFooter />
    </div>
  );
}
