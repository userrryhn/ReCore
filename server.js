const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const PRICE_MAP = {
  "Hoodie Oversize": "price_1T2Nk4RreRSaK4aag1WLadRl",
  "T-Shirt Signature": "price_1T2Nm9RreRSaK4aaMyIrSMZ9",
  "Jogging Premium": "price_1T2NmiRreRSaK4aaBfDvzwyj",
  "Formation Business": "price_1T2NnVRreRSaK4aajFtKjnAL",
  "Pack IA": "price_1T2No3RreRSaK4aaUSYHUBMa",
  "Logiciel Automation": "price_1T2NopRreRSaK4aam9YTuhUH"
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide." });
    }

    const grouped = {};
    for (const item of cart) {
      if (!PRICE_MAP[item.name]) continue;
      grouped[item.name] = (grouped[item.name] || 0) + 1;
    }

    const line_items = Object.entries(grouped).map(([name, quantity]) => ({
      price: PRICE_MAP[name],
      quantity
    }));

    if (!line_items.length) {
      return res.status(400).json({ error: "Aucun produit Stripe valide." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.CLIENT_URL}/success.html`,
      cancel_url: `${process.env.CLIENT_URL}/cancel.html`
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 4242, () => {
  console.log("Stripe backend lancé sur http://localhost:4242");
});
