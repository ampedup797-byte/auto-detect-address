import OrderError from '../OrderError';

export default function OrderErrorExample() {
  const handleRetry = () => {
    console.log('Retry clicked');
  };

  return (
    <OrderError
      message="Unable to connect to Shopify. Please check your credentials and try again."
      onRetry={handleRetry}
    />
  );
}
