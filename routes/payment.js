const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/", async (req, res) => {
  const { cart } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart.map((item) => ({
        price_data: {
          currency: "php",
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: item.regularPrice * 100,
        },
        quantity: item.amount,
      })),
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
