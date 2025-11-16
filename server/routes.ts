import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import variantsMap from "../variants_map.json";

const SHOPIFY_STORE_URL = "https://t1akyv-ss.myshopify.com";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/create-cod-order", async (req, res) => {
    try {
      const { name, phone, email, address, city, state, pincode } = req.body;

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
              title: "Custom COD Order",
              quantity: 1,
              price: "0.00",
            },
          ],
          customer: {
            first_name: name,
            email: email,
            phone: phone,
          },
          billing_address: {
            address1: address,
            city: city,
            province: state,
            zip: pincode,
            country: "India",
          },
          shipping_address: {
            address1: address,
            city: city,
            province: state,
            zip: pincode,
            country: "India",
          },
          financial_status: "pending",
          tags: ["COD"],
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
