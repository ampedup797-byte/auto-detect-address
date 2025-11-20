import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Loader2 } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface OrderFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading?: boolean;
}

export interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function OrderForm({ onSubmit, isLoading = false }: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Card className="p-8" data-testid="card-order-form">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-form-title">
          Complete order
        </h2>
        <p className="text-sm text-muted-foreground" data-testid="text-form-description">
          Fill in customer details to create a COD order in Shopify
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            data-testid="input-name"
            placeholder="Enter customer's full name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={errors.name ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1" data-testid="error-name">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            data-testid="input-phone"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={errors.phone ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1" data-testid="error-phone">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            placeholder="customer@example.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={errors.email ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1" data-testid="error-email">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium">
            Street Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            data-testid="input-address"
            placeholder="House number, street name"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={errors.address ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.address && (
            <p className="text-sm text-destructive mt-1" data-testid="error-address">
              {errors.address}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city" className="text-sm font-medium">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              data-testid="input-city"
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={errors.city ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.city && (
              <p className="text-sm text-destructive mt-1" data-testid="error-city">
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="state" className="text-sm font-medium">
              State <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.state}
              onValueChange={(value) => handleChange("state", value)}
              disabled={isLoading}
            >
              <SelectTrigger
                id="state"
                data-testid="select-state"
                className={errors.state ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-sm text-destructive mt-1" data-testid="error-state">
                {errors.state}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="pincode" className="text-sm font-medium">
              Pincode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pincode"
              data-testid="input-pincode"
              placeholder="123456"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, ""))}
              className={errors.pincode ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.pincode && (
              <p className="text-sm text-destructive mt-1" data-testid="error-pincode">
                {errors.pincode}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full md:w-auto"
            size="lg"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-5 w-5" />
                Complete Order
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
