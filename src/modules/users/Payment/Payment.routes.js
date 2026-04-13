import { Router } from "express";
import express from "express"; 
import { auth } from "../../../middleware/Auth/auth.js";
import * as PY from "./Payment.controller.js"




const PaymentRouter= Router()



PaymentRouter.post('/subscribe', auth, PY.createSubscription);

PaymentRouter.post('/webhook',  express.raw({ type: 'application/json' }), PY.stripeWebhook);


export default PaymentRouter