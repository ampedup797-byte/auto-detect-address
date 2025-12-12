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
  onSubmit: (formData: FormData) => void | Promise<void>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // ---------- Helper for improved Meesho-style formatting ----------
  //
  function component(components: any[], type: string) {
    const c = components.find((x) => x.types && x.types.includes(type));
    return c ? c.long_name : "";
  }

  /**
   * Build Meesho-style address:
   * - Force big-city (administrative_area_level_2) into city
   * - Put locality / sublocality / neighborhood into street/area line
   * - Build houseNo from premise/subpremise/street_number joined by '/'
   */
  function buildMeeshoAddress(components: any[]) {
    const get = (t: string) => component(components, t);

    const subpremise = get("subpremise"); // floor/flat
    const premise = get("premise"); // building name
    const streetNumber = get("street_number");
    const route = get("route"); // street
    const sublocality1 = get("sublocality_level_1") || get("sublocality");
    const sublocality2 = get("sublocality_level_2");
    const neighborhood = get("neighborhood");
    const postal_town = get("postal_town");
    const locality = get("locality");
    const adminArea2 = get("administrative_area_level_2"); // district
    const state = get("administrative_area_level_1");
    const postal_code = get("postal_code");

    // Force city to adminArea2 or postal_town, fallback to locality
    const city = adminArea2 || postal_town || locality || "";

    // Build houseNo: premise / subpremise / streetNumber (keep order to match Meesho)
    const houseParts: string[] = [];
    if (premise) houseParts.push(premise);
    if (subpremise) houseParts.push(subpremise);
    if (streetNumber) houseParts.push(streetNumber);
    const houseNo = houseParts.filter(Boolean).join("/");

    // Road / Area line: route, sublocalities, neighborhood, locality
    const roadParts: string[] = [];
    if (route) roadParts.push(route);
    if (sublocality1) roadParts.push(sublocality1);
    if (sublocality2 && !roadParts.includes(sublocality2)) roadParts.push(sublocality2);
    if (neighborhood && !roadParts.includes(neighborhood)) roadParts.push(neighborhood);
    if (locality && !roadParts.includes(locality)) roadParts.push(locality);

    // Add adminArea2 at the end only if it's not the same as City
    if (adminArea2 && !roadParts.includes(adminArea2) && adminArea2 !== city) {
      roadParts.push(adminArea2);
    }

    let roadLine = roadParts.join(", ");
    if (!roadLine) {
      roadLine = premise || locality || adminArea2 || "";
    }

    const line2Parts: string[] = [];
    if (city) line2Parts.push(city);
    if (state) line2Parts.push(state);
    const line2 = line2Parts.join(", ") + (postal_code ? ` - ${postal_code}` : "");

    return {
      line1: roadLine.trim(),
      line2: line2.trim(),
      houseNo: houseNo || premise || subpremise || streetNumber || "",
      street: route || roadLine || "",
      city: city || "",
      state: state || "",
      pincode: postal_code || "",
    };
  }

  //
  // ---------- detectAddress (uses Google Geocode webservice like old file but formatted smarter) ----------
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

          // Put your client key here (same as old working approach)
          const apiKey = "AIzaSyCM_l3ma9CWW-3lFYZXbPr6ZFDGcjq3xvA"; // <-- replace with your key (or keep your hardcoded key)
          if (!apiKey || apiKey === "") {
            console.warn("Google API key missing in detectAddress. Replace apiKey with your key.");
            return;
          }

          // Use rooftop filter for accuracy (like earlier suggestion). Fallback handled by code below.
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&location_type=ROOFTOP&key=${apiKey}`;

          let res = await fetch(url);
          let data = await res.json();

          // Fallback to broader geocode if rooftop yields nothing
          if (!data || !data.results || data.results.length === 0) {
            const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
            res = await fetch(fallbackUrl);
            data = await res.json();
          }

          if (!data || !data.results || data.results.length === 0) {
            console.warn("No geocode results");
            return;
          }

          // Choose best result: prefer a result that contains postal_code
          let chosenResult = data.results[0];
          if (!chosenResult.address_components.some((c: any) => c.types.includes("postal_code"))) {
            const found = data.results.find((r: any) =>
              r.address_components && r.address_components.some((c: any) => c.types.includes("postal_code"))
            );
            if (found) chosenResult = found;
          }

          const components = chosenResult.address_components || [];

          // Build Meesho-style formatted object
          const formatted = buildMeeshoAddress(components);

          // Fill form exactly with same keys as old file
          setFormData((prev) => ({
            ...prev,
            houseNo: formatted.houseNo || prev.houseNo,
            address: formatted.line1 || prev.address,
            city: formatted.city || prev.city,
            state: formatted.state || prev.state,
            pincode: formatted.pincode || prev.pincode,
          }));

          console.log("DEBUG Auto-filled Meesho-style:", {
            line1: formatted.line1,
            line2: formatted.line2,
            houseNo: formatted.houseNo,
            city: formatted.city,
            state: formatted.state,
            pincode: formatted.pincode,
          });
        } catch (err) {
          console.error("Error fetching address:", err);
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

  // Keep the original behavior: call onSubmit(formData).
  // But add logs and support asynchronous onSubmit returns to catch server errors.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Log payload for debugging server 400 issues
    console.log("Submitting order payload:", formData);

    try {
      // If onSubmit returns a Promise (e.g. you call an API here), await it and catch errors.
      const maybePromise = onSubmit(formData);
      if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
        await maybePromise;
      }
    } catch (err: any) {
      // Show friendly message + full console for dev
      console.error("Order submission failed:", err);
      // If server returned a JSON error string, show it (best-effort)
      const msg = err?.message || "Failed to create order. Check console.";
      alert(`Order failed: ${msg}`);
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

 
    
  
   
  
        
