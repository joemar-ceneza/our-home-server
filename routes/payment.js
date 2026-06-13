const express = require("express");
const Stripe = require("stripe");
const Product = require("../models/product");
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/", async (req, res) => {
  const { cart } = req.body;

  try {
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Look the products up by id and price/quantity them from the database.
    // Never trust the prices the client sends — they can be edited in DevTools.
    const ids = cart.map((item) => item._id);
    const products = await Product.find({ _id: { $in: ids } });
    const productById = new Map(products.map((p) => [p._id.toString(), p]));

    const line_items = cart.map((item) => {
      const product = productById.get(String(item._id));
      if (!product) {
        throw new Error(`Product not found: ${item._id}`);
      }

      const quantity = Math.max(1, parseInt(item.amount, 10) || 1);
      const unitPrice =
        product.isOnSale && product.salePrice > 0
          ? product.salePrice
          : product.regularPrice;

      return {
        price_data: {
          currency: "php",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      shipping_address_collection: {
        allowed_countries: ["PH", "US", "GB"],
      },
    });

    res.json({ stripeSession: session });
  } catch (error) {
    console.error("Error during Stripe session creation: ", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;
