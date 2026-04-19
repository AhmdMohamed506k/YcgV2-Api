import Stripe from "stripe";
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";

const stripe = new Stripe(process.env.MyStripeAPIkey);

export const CreateCheckoutSession = asyncHandler(async (req, res, next) => {
  const { priceId } = req.body;

  const userId = req.user._id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FrontEnd_Url}/success`,
    cancel_url: `${process.env.FrontEnd_Url}/cancel`,
    metadata: { userId: userId.toString() },
  });

  if (!session) {
    return next(new Error({ msg: "Sorry an error occurred" }, 400));
  }

  res.status(200).json({ status: "success", url: session.url });
});

export const stripeWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
  
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    
    console.error(`Webhook Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "invoice.payment_succeeded":
      const session = event.data.object;
      const userId = session.metadata.userId;

      await userModel.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      break;

    case "customer.subscription.deleted":
      const subscription = event.data.object;

      await userModel.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        { isPremium: false },
      );
      break;
  }

  res.json({ received: true });
});
