import Stripe from "stripe";
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import { userModel } from "../../../DB/models/User/user_main_model/user.model.js";
import companyModel  from "../../../DB/models/company/company.model.js";
import { sendEmail } from "../../service/send_email/send_email.js";
import  redisClient  from "../../utils/redis_client/redis_client.js";

const stripe = new Stripe(process.env.MyStripeAPIkey)



// =============================User-Subscription===============================================
export const CreateUserMonthlySubscriptionCheckOut = asyncHandler(async(req,res,next)=>{

   
  const userId=req.user._id;

  const Product_Price_ID = process.env.StripePriceID
  

  if (req.user.isPremium) {
    return next(new Error("You are already a premium user", { cause: 400 }));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    mode:"subscription",
    line_items:[{price:Product_Price_ID,quantity:1},],

    subscription_data:{
      trial_period_days:30,
    },


    metadata:{
      userId:userId.toString(),
      type:"user_monthly_subscription"
    },
    success_url:`${process.env.FrontEnd_Url}/subscription/success?session_id={CHECKOUT_SESSION_KEY}`,
    cancel_url:`${process.env.FrontEnd_Url}/subscription/cancel`
    
  })

 

  res.status(200).json({status:"success",url:session.url })


}) 


// =============================Companies-Subscription===============================================
export const CreateCompanySubscriptionCheckOut = asyncHandler(async (req, res, next) => {

  
  const companyId = req.company._id; 

  const priceId =  process.env.StripePriceID;

  

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",


    success_url: `${process.env.FrontEnd_Url}/success`,
    cancel_url: `${process.env.FrontEnd_Url}/cancel`,
    metadata: {
      type: "company_monthly_subscription", 
      companyId: companyId.toString(),
    },
  });

  res.status(200).json({ success: true, url: session.url });
});




// =============================GlobalWebHook===============================================
export const GlobalWebHook = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }



  switch (event.type) {
    // ====Free-Trail-Event=================> Event1 
    case "customer.subscription.created": {
      const subscription = event.data.object;

    
      await userModel.findOneAndUpdate({ stripeCustomerId: subscription.customer }, { isPremium: true, role: "premium_user" });
      
     
      await companyModel.findOneAndUpdate({ stripeCustomerId: subscription.customer }, { isPremium: true });
      
      console.log(`Trial Started for: ${subscription.customer}`);
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object;
      
      //users
      const user = await userModel.findOne({ stripeCustomerId: subscription.customer });
      if (user) {
        await sendEmail({ to: user.email, subject: "Trial Ending", html: "..." });
      }

      //Companies
      const company = await companyModel.findOne({ stripeCustomerId: subscription.customer });
      if (company) {
        await sendEmail({ to: company.email, subject: "Trial Ending", html: "..." });
      }
      break;
    }

    // ===Create-Subscription-For-First-Time==========> Event2 
    case "checkout.session.completed": {
      const session = event.data.object;
      const { metadata } = session;

      //users
      if (metadata.type === "user_monthly_subscription" && metadata.userId) {
        await userModel.findByIdAndUpdate(metadata.userId, {
          isPremium: true,
          role: "premium_user",
          stripeCustomerId: session.customer
        });
        await redisClient.del(`user:profile:${metadata.userId}`);
      }
      
      //Companies
      else if (metadata.type === "company_monthly_subscription" && metadata.companyId) {
        await companyModel.findByIdAndUpdate(metadata.companyId, {
          isPremium: true,
          stripeCustomerId: session.customer
        });
      }
      break;
    }

    // ====Update-Subscription=============> Event3 
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      
       //users
      const user = await userModel.findOneAndUpdate({ stripeCustomerId: invoice.customer }, { isPremium: true });
      if (user) {
        await redisClient.del(`user:profile:${user._id}`);
      }

      //Companies
      await companyModel.findOneAndUpdate({ stripeCustomerId: invoice.customer }, { isPremium: true });
      break;
    }

    // =====End-Subscription==============>Event4 
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      
      //users
      const user = await userModel.findOneAndUpdate({ stripeCustomerId: subscription.customer }, { isPremium: false, role: "user" });
      if (user) {
        await redisClient.del(`user:profile:${user._id}`);
      }

      //Companies
      await companyModel.findOneAndUpdate({ stripeCustomerId: subscription.customer }, { isPremium: false });
      
      console.log(`Subscription deleted for: ${subscription.customer}`);
      break;
    }
  }

  res.status(200).json({ received: true });
});


