export default function OrderFormFooter() {
  return (
    <footer className="border-t bg-card mt-auto" data-testid="footer-main">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-footer-info">
            ✔︎ Trusted & Secure Checkout
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" data-testid="status-indicator"></div>
              <span className="text-sm text-muted-foreground" data-testid="text-api-status">
                Secure Connection Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
