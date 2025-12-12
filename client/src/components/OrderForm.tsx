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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // ---------- Improved Meesho-style formatter (REPLACED) ----------
  //

  function component(components: any[], type: string) {
    const c = components.find((x) => x.types && x.types.includes(type));
    return c ? c.long_name : "";
  }

  /**
   * Improved Meesho-like formatter
   * - prefer administrative_area_level_2 (district) or postal_town as city if 'locality' is very small
   * - build houseNo by combining premise/subpremise/street_number
   * - build a fuller Road/Area line including neighborhood, sublocality, district
   */
  function buildMeeshoAddress(components: any[]) {
    const get = (t: string) => component(components, t);

    const subpremise = get("subpremise"); // e.g., "3rd Floor" or flat no
    const premise = get("premise"); // building name
    const streetNumber = get("street_number"); // e.g., "83"
    const route = get("route"); // street name
    const sublocality1 = get("sublocality_level_1") || get("sublocality");
    const sublocality2 = get("sublocality_level_2");
    const neighborhood = get("neighborhood");
    const postal_town = get("postal_town"); // sometimes useful
    const locality = get("locality"); // often small locality like Champapet
    const adminArea2 = get("administrative_area_level_2"); // district (Hyderabad)
    const state = get("administrative_area_level_1");
    const postal_code = get("postal_code");

    // === Decide city ===
    const smallLocality =
      locality &&
      locality.length < 18 &&
      /colony|nagar|village|chowk|pet|colony|gaon|gudem|peta|pet/i.test(locality);
    const city = (!locality || smallLocality) ? (postal_town || adminArea2 || locality) : (locality || adminArea2 || postal_town);

    // === Build houseNo ===
    const houseParts: string[] = [];
    if (premise) houseParts.push(premise); // building
    if (subpremise) houseParts.push(subpremise); // floor/flat
    if (!premise && streetNumber) houseParts.push(streetNumber); // if no building, include street no
    if (premise && streetNumber) {
      if (!premise.includes(streetNumber)) houseParts.push(streetNumber);
    }
    const houseNo = houseParts.join("/"); // e.g., "17-1-382/P/83" or "Sai Residency/3rd Floor/83"

    // === Build Road/Area line (line1 for "address" input) ===
    const roadParts: string[] = [];
    if (route) roadParts.push(route);
    if (sublocality1) roadParts.push(sublocality1);
    if (sublocality2 && !roadParts.includes(sublocality2)) roadParts.push(sublocality2);
    if (neighborhood && !roadParts.includes(neighborhood)) roadParts.push(neighborhood);

    if (adminArea2 && !roadParts.includes(adminArea2) && adminArea2 !== city) {
      roadParts.push(adminArea2);
    }

    let roadLine = roadParts.join(", ");
    if (!roadLine) {
      if (premise) roadLine = premise;
      else roadLine = locality || adminArea2 || "";
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
  // ---------- detectAddress (Meesho-style, client-only) ----------
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

          // ======= PUT YOUR KEY HERE (client-side) =======
          // Replace with your real key or keep current manual method
          const apiKey = "AIzaSyCM_l3ma9CWW-3lFYZXbPr6ZFDGcjq3xvA"; // <-- replace
          // ==============================================

          if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
            console.warn("Google API key missing in detectAddress. Replace apiKey with your key.");
            return;
          }

          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&location_type=ROOFTOP&key=${apiKey}`;

          const res = await fetch(url);
          if (!res.ok) {
            console.warn("Geocode HTTP error", res.status, await res.text());
            return;
          }
          const data = await res.json();

          if (!data.results || data.results.length === 0) {
            console.warn("No geocode results");
            return;
          }

          let chosenResult = data.results[0];
          if (!chosenResult.address_components.some((c: any) => c.types.includes("postal_code"))) {
            const found = data.results.find((r: any) =>
              r.address_components && r.address_components.some((c: any) => c.types.includes("postal_code"))
            );
            if (found) chosenResult = found;
          }

          const components = chosenResult.address_components || [];

          const formatted = buildMeeshoAddress(components);

          const displayAddress = formatted.line1;
          const displayCity = formatted.city;
          const displayState = formatted.state;
          const displayPin = formatted.pincode;

          // If houseNo has slashes like "premise/subpremise/number" we want to put number part into house field
          // Keep as-is for now (Meesho often shows houseNo as 17-1-382/P/83)
          setFormData((prev) => ({
            ...prev,
            houseNo: formatted.houseNo || prev.houseNo,
            address: displayAddress || prev.address,
            city: displayCity || prev.city,
            state: displayState || prev.state,
            pincode: displayPin || prev.pincode,
          }));

          console.log("Auto-filled Meesho-style address:");
          console.log(formatted.line1);
          console.log(formatted.line2);
        } catch (err) {
          console.error("Error fetching address:", err);
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


    

       

     
     
 


      
         
        
           
        
         
             
             
            
          
