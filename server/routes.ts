import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";

const variantsMap = require("../variants_map.json");
const SHOPIFY_STORE_URL = "https://t1akyv-ss.myshopify.com";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/create-cod-order", async (req, res) => {
    try {
        // ---------------- DEBUG LOGS START ----------------
        console.log("=== DEBUG /api/create-cod-order START ===");
        console.log("DEBUG req.body:", req.body);
        console.log("DEBUG keys req.body:", Object.keys(req.body || {}));
        // ---------------- DEBUG LOGS END ------------------

        const { name,
                phone, 
                email, 
                houseNo,
                address, 
                city, 
                state, 
                pincode, 
                product_id,  
                size 
                } = req.body || {};


      // Extra details shown in Shopify under "Additional details"
const noteAttributes = [
  { name: "NAME", value: name || "" },
  { name: "Phone number", value: phone || "" },
  { name: "Road name/ Area /colony", value: address || "" },
  { name: "House no", value: houseNo || "" },
  { name: "City", value: city || "" },
  { name: "State", value: state || "" },
  { name: "zip_code", value: pincode || "" },
  { name: "Size", value: size || "" },
  { name: "Email", value: email || "" },
];      
      //const { product_id, size } = req.body;
      // convert to string because JSON keys are strings
      const pid = String(product_id);
      const sizeKey = String(size);

      // ---------- DEBUG pid & size ----------
      console.log("DEBUG pid:", pid);
      console.log("DEBUG sizeKey:", sizeKey);
      console.log("DEBUG variantsMap has pid?:", !!variantsMap[pid]);
      console.log("DEBUG variantsMap entry:", variantsMap[pid]);      
      // find variant id from variants_map.json
      
      const variantId =
        variantsMap[pid]?.variants[sizeKey] ||
        variantsMap[pid]?.variants[sizeKey.toUpperCase()] ||
        variantsMap[pid]?.variants[sizeKey.toLowerCase()];
      
      if (!variantId) {
        return res.status(400).json({
          success: false,
          message: `Variant not found for product_id ${pid} and size ${sizeKey}`
        });
      }
      if (!process.env.SHOPIFY_ACCESS_TOKEN) {
        return res.status(500).json({ 
          success: false, 
          message: "Shopify access token not configured" 
        });
      }

      const orderData = {
        order: {
          line_items: [
            {
              variant_id: Number(variantId),
              quantity: 1
            }
          ],
            customer: {
            first_name: name,
            email: email,
            phone: phone,
          },
          billing_address: {
            address1: addressLine1,
            city: city,
            province: state,
            zip: pincode,
            country: "India",
          },
          shipping_address: {
            address1: addressLine1,
            city: city,
            province: state,
            zip: pincode,
            country: "India",
          },
          financial_status: "pending",
          tags: ["COD"],

          note_attributes: noteAttributes,
        },
      };

      const response = await fetch(`${SHOPIFY_STORE_URL}/admin/api/2024-10/orders.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json() as any;
      console.log("Shopify Response:", data);

      if (response.ok && data.order) {
        res.json({ 
          success: true, 
          message: "COD Order created successfully!", 
          order_id: data.order.id,
          order_number: data.order.order_number 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: data.errors || "Failed to create order in Shopify" 
        });
      }
    } catch (error) {
      console.error("Error creating COD order:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error while creating order" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
