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

  // load Google Maps JS library once
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!key) {
      console.warn("Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local for Maps JS API");
      // still call detectAddress which will warn about missing google object
    }
    // if script already present, skip adding
    if (typeof window !== "undefined" && !(window as any).google) {
      const id = "google-maps-js";
      if (!document.getElementById(id)) {
        const s = document.createElement("script");
        s.id = id;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        s.async = true;
        s.defer = true;
        s.onload = () => {
          console.log("Google Maps JS loaded");
        };
        s.onerror = () => {
          console.error("Failed to load Google Maps JS");
        };
        document.head.appendChild(s);
      }
    }
    // start detection once (will wait for script if needed)
    detectAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- helper functions ----------
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
   * detectAddress - uses Maps JS API (Geocoder + PlacesService)
   * No CORS errors because JS SDK is built for browser usage.
   */
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

          // Wait up to ~3 seconds for window.google to be ready (if script is still loading)
          const waitForGoogle = () =>
            new Promise<void>((resolve) => {
              const start = Date.now();
              const interval = setInterval(() => {
                if ((window as any).google && (window as any).google.maps && (window as any).google.maps.Geocoder) {
                  clearInterval(interval);
                  resolve();
                } else if (Date.now() - start > 3000) {
                  clearInterval(interval);
                  resolve(); // resolve anyway; fallback will try to use JS fetch approach (but likely fail due to CORS)
                }
              }, 150);
            });

          await waitForGoogle();

          // If google is available, use Geocoder + PlacesService (preferred)
          if ((window as any).google && (window as any).google.maps && (window as any).google.maps.Geocoder) {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
              if (status === "OK" && results && results.length) {
                const best = results[0];
                const components = best.address_components || [];
                const placeId = best.place_id;

                // If we have a placeId, fetch place details for place name/landmark
                if (placeId && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
                  // PlacesService needs a map or element — create offscreen div
                  const offDiv = document.createElement("div");
                  const map = new (window as any).google.maps.Map(offDiv);
                  const service = new (window as any).google.maps.places.PlacesService(map);
                  service.getDetails(
                    { placeId, fields: ["name", "address_components", "formatted_address"] },
                    (placeResult: any, placeStatus: string) => {
                      const formatted = formatAddress(components, placeResult);
                      setFormData((prev) => ({
                        ...prev,
                        houseNo: formatted.house || prev.houseNo,
                        address: formatted.street || formatted.area || formatted.fullAddress || prev.address,
                        city: formatted.city || prev.city,
                        state: formatted.state || prev.state,
                        pincode: formatted.pincode || prev.pincode,
                      }));
                      console.log("Auto-filled via Google Maps JS (places):", formatted);
                    }
                  );
                } else {
                  // No placeId or Places not available — fallback to using geocode components only
                  const formatted = formatAddress(components, null);
                  setFormData((prev) => ({
                    ...prev,
                    houseNo: formatted.house || prev.houseNo,
                    address: formatted.street || formatted.area || formatted.fullAddress || prev.address,
                    city: formatted.city || prev.city,
                    state: formatted.state || prev.state,
                    pincode: formatted.pincode || prev.pincode,
                  }));
                  console.log("Auto-filled via Google Maps JS (geocode only):", formatted);
                }
                return;
              }

              console.warn("Geocoder failed or returned no results:", status, results);
            });
            return;
          }

          // If google SDK not available (script failed to load), fallback to your original fetch geocode.
          // NOTE: calling maps.googleapis.com directly from browser may hit CORS -> might fail.
          console.warn("Google Maps JS not available — falling back to direct web service (may be blocked by CORS).");

          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
          if (!apiKey) {
            console.warn("No API key found for fallback direct fetch.");
            return;
          }

          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&location_type=ROOFTOP&result_type=street_address&key=${apiKey}`;
          const resp = await fetch(geoUrl);
          const data = await resp.json();
          if (!data.results || !data.results[0]) {
            console.warn("No geocode results from fallback fetch");
            return;
          }
          const components = data.results[0].address_components || [];
          const formatted = formatAddress(components, null);
          setFormData((prev) => ({
            ...prev,
            houseNo: formatted.house || prev.houseNo,
            address: formatted.street || formatted.area || formatted.fullAddress || prev.address,
            city: formatted.city || prev.city,
            state: formatted.state || prev.state,
            pincode: formatted.pincode || prev.pincode,
          }));
          console.log("Auto-filled via fallback fetch:", formatted);
        } catch (err) {
          console.error("Error detecting address:", err);
        }
      },
      (err) => {
        console.warn("Location permission denied or error:", err);
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
