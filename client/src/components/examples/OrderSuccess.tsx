import OrderSuccess from '../OrderSuccess';

export default function OrderSuccessExample() {
  const handleCreateAnother = () => {
    console.log('Create another order clicked');
  };

  return (
    <OrderSuccess
      orderId="123456789"
      shopifyUrl="https://shopify.com/admin/orders/123456789"
      onCreateAnother={handleCreateAnother}
    />
  );
}
