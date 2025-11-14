import { Store } from "lucide-react";

export default function OrderFormHeader() {
  return (
    <header className="border-b bg-card" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
              MODEVO
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-app-subtitle">
              Cash on Delivery
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
