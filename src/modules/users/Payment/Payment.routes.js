import { Router } from "express";
import { auth } from "../../../middleware/Auth/auth.js";
import * as PY from "./Payment.controller.js"
import express from "express"; 



const PaymentRouter= Router()



PaymentRouter.post('/subscribe', auth, PY.CreateCheckoutSession);

PaymentRouter.post('/webhook',  express.raw({ type: 'application/json' }), PY.stripeWebhook);


export default PaymentRouter