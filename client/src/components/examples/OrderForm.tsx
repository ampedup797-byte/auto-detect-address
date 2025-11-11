import OrderForm from '../OrderForm';

export default function OrderFormExample() {
  const handleSubmit = (formData: any) => {
    console.log('Order submitted:', formData);
  };

  return <OrderForm onSubmit={handleSubmit} />;
}
