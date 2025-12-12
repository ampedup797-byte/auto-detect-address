import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";

const variantsMap = require("../variants_map.json");
const SHOPIFY_STORE_URL = "https://t1akyv-ss.myshopify.com";

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/create-cod-order", async (req, res) => {
    try {

      /* --------------------------------------------------------
         🔥 SUPER DEBUGGER — SHOW EVERYTHING
      ---------------------------------------------------------*/
      console.log("======== NEW COD ORDER REQUEST ========");
      console.log("FULL req.body:", JSON.stringify(req.body, null, 2));
      console.log("ENV CHECK -> token exists?", !!process.env.SHOPIFY_ACCESS_TOKEN);
      console.log("ENV CHECK -> token preview:", process.env.SHOPIFY_ACCESS_TOKEN ? process.env.SHOPIFY_ACCESS_TOKEN.slice(0,8) + "..." : "NO TOKEN");
      console.log("ENV CHECK -> store URL:", SHOPIFY_STORE_URL);
      console.log("========================================");

      const {
        name,
        phone,
        email,
        houseNo,
        addressLine1,
        address,
        city,
        state,
        pincode,
        product_id,
        size
      } = req.body || {};

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

      const pid = String(product_id);
      const sizeKey = String(size);

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
          message: "Shopify access token missing"
        });
      }

      const orderData = {
        order: {
          line_items: [
            { variant_id: Number(variantId), quantity: 1 }
          ],
          customer: {
            first_name: name,
            email,
            phone
          },
          billing_address: {
            address1: addressLine1,
            city,
            province: state,
            zip: pincode,
            country: "India"
          },
          shipping_address: {
            address1: addressLine1,
            city,
            province: state,
            zip: pincode,
            country: "India"
          },
          financial_status: "pending",
          tags: ["COD"],
          note_attributes: noteAttributes
        }
      };

      console.log("Sending orderData:", JSON.stringify(orderData, null, 2));

      /* --------------------------------------------------------
         🔥 SHOPIFY RAW DEBUG RESPONSE BLOCK
      ---------------------------------------------------------*/
      const shopifyRes = await fetch(`${SHOPIFY_STORE_URL}/admin/api/2024-10/orders.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify(orderData),
      });

      const raw = await shopifyRes.text();

      console.log("==== SHOPIFY RAW RESPONSE START ====");
      console.log("STATUS:", shopifyRes.status);
      console.log("BODY:", raw);
      console.log("==== SHOPIFY RAW RESPONSE END ====");

      let shopifyJson = null;
      try {
        shopifyJson = JSON.parse(raw);
      } catch (_) {}

      if (!shopifyRes.ok) {
        return res.status(400).json({
          success: false,
          message: "Shopify rejected order",
          status: shopifyRes.status,
          shopifyResponse: raw
        });
      }

      return res.json({
        success: true,
        message: "COD Order created!",
        shopify: shopifyJson
      });

    } catch (err: any) {
      console.error("FATAL BACKEND ERROR:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Server crashed",
        stack: err.stack,
        receivedPayload: req.body
      });
    }
  });

  /* --------------------------------------------------------
     DEBUG ENDPOINT (OPTIONAL)
  ---------------------------------------------------------*/
  app.get("/api/_debug_env", (req, res) => {
    try {
      const token = process.env.SHOPIFY_ACCESS_TOKEN;
      const store = SHOPIFY_STORE_URL;

      res.json({
        hasToken: !!token,
        tokenMasked: token ? `${token.slice(0, 8)} ... ${token.slice(-6)}` : null,
        storeUrl: store,
        nodeEnv: process.env.NODE_ENV || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
