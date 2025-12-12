import { useState, useEffect } from "react";
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
  houseNo: string;
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
    houseNo: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    detectAddress();
  }, []);

  //
  // ---------- Helper functions for smart address formatting ----------
  //

  function getComponent(components: any[], type: string) {
    const comp = components.find((c) => c.types.includes(type));
    return comp ? comp.long_name : "";
  }

  function formatAddress(components: any[], placeResult?: any) {
    const house =
      getComponent(components, "subpremise") ||
      getComponent(components, "premise") ||
      getComponent(components, "street_number");

    const street = getComponent(components, "route");

    const area =
      getComponent(components, "sublocality_level_1") ||
      getComponent(components, "sublocality") ||
      getComponent(components, "neighborhood");

    const city =
      getComponent(components, "locality") ||
      getComponent(components, "administrative_area_level_2");

    const state =
      getComponent(components, "administrative_area_level_1");

    const pincode = getComponent(components, "postal_code");

    const placeName = placeResult?.name || "";

    const line1Parts: string[] = [];
    if (placeName) line1Parts.push(placeName);
    if (house) line1Parts.push(house);
    if (street) line1Parts.push(street);

    const line2Parts: string[] = [];
    if (area) line2Parts.push(area);
    if (city) line2Parts.push(city);
    if (state) line2Parts.push(state);
    if (pincode) line2Parts.push(pincode);

    const fullAddress =
      (line1Parts.join(", ") || "") +
      (line2Parts.length ? (line1Parts.length ? ", " : "") + line2Parts.join(", ") : "");

    return {
      fullAddress,
      house,
      street,
      area,
      city,
      state,
      pincode,
      landmark: placeName,
    };
  }

  /**
   * getSmartAddress
   * - lat,lng → reverse geocode (ROOFTOP, street_address)
   * - get place_id → Place Details for richer place name
   * - format using formatAddress()
   *
   * NOTE: It's safer to call your own backend endpoint that stores API key.
   * For quick testing we read a frontend env var (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
   */
  async function getSmartAddress(lat: number, lng: number) {
    // QUICK TEST SETUP:
    // If you already have a backend endpoint that holds the key, replace this fetch
    // with something like: fetch(`/api/get-address?lat=${lat}&lng=${lng}`)
    // and return the formatted object directly from server.
    //
    // FRONTEND KEY (only for quick dev testing):
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCM_l3ma9CWW-3lFYZXbPr6ZFDGcjq3xvA";

    if (!API_KEY) {
      console.warn("No Google Maps API key found in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Consider moving API calls to your backend.");
    }

    try {
      // 1) Reverse geocode: ask for rooftop/street to increase accuracy
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&location_type=ROOFTOP&result_type=street_address&key=${API_KEY}`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();

      if (!geoData || !geoData.results || geoData.results.length === 0) {
        // fallback: try a broader geocode without filters
        const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;
        const fallbackResp = await fetch(fallbackUrl);
        const fallbackData = await fallbackResp.json();
        if (!fallbackData || !fallbackData.results || fallbackData.results.length === 0) {
          throw new Error("No geocode results");
        }
        geoData.results = fallbackData.results;
      }

      const bestResult = geoData.results[0];
      const components = bestResult.address_components || [];
      const placeId = bestResult.place_id;

      let placeResult: any = null;
      if (placeId) {
        // 2) Place Details: gives place name/landmark + structured components (enable Places API)
        const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,address_component&key=${API_KEY}`;
        const placeResp = await fetch(placeUrl);
        const placeData = await placeResp.json();
        placeResult = placeData.result || null;
      }

      // 3) Format to Meesho-style address
      return formatAddress(components, placeResult);
    } catch (err) {
      console.error("getSmartAddress error:", err);
      throw err;
    }
  }

  //
  // ---------- detectAddress: uses getSmartAddress and updates form state ----------
  //
  const detectAddress = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // If you have server-side endpoint, replace with:
          // const resp = await fetch(`/api/get-address?lat=${lat}&lng=${lng}`);
          // const formatted = await resp.json();
          //
          // For quick dev, using getSmartAddress (frontend key). Move to backend for prod.
          const formatted = await getSmartAddress(lat, lng);

          // update React state directly ✅
          setFormData((prev) => ({
            ...prev,
            houseNo: formatted.house || prev.houseNo,
            address: formatted.street || formatted.area || formatted.fullAddress || prev.address,
            city: formatted.city || prev.city,
            state: formatted.state || prev.state,
            pincode: formatted.pincode || prev.pincode,
          }));

          console.log("DEBUG filled via React (smart):", formatted);
        } catch (err) {
          console.error("Error fetching smart address:", err);
        }
      },
      () => {
        console.warn("Location permission denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
    if (!formData.houseNo.trim()) {
      newErrors.houseNo = "House / building name is required";
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
          🗒️Complete Your Order
        </h2>
        <p className="text-sm text-muted-foreground" data-testid="text-form-description">
          Enter your delivery details for cash on
          Delivery.
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
            placeholder="Enter Your full name"
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
            placeholder="your@gmail.com"
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
          <Label htmlFor="houseNo" className="text-sm font-medium">
            House / Building Name <span className="text-destructive">*</span>
          </Label>

          <Input
            id="houseNo"
            data-testid="input-houseNo"
            placeholder="Flat / House No / Building Name"
            value={formData.houseNo}
            onChange={(e) => handleChange("houseNo", e.target.value)}
            className={errors.houseNo ? "border-destructive" : ""}
            disabled={isLoading}
          />

          {errors.houseNo && (
            <p className="text-sm text-destructive mt-1" data-testid="error-houseNo">
              {errors.houseNo}
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
            {/* Hidden input so auto-detect can fill it */}
            <input
              type="text"
              id="state"
              style={{ display: "none" }}
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
            />

            <Select
              value={formData.state}
              onValueChange={(value) => handleChange("state", value)}
              disabled={isLoading}
            >
              <SelectTrigger
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
