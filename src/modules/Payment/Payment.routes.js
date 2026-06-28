import { Router } from "express";
import { auth } from "../../middleware/Auth/auth.js";
import * as PY from "./Payment.controller.js"
import express from "express"; 



const PaymentRouter= Router()

// =============================User-Subscription===============================================
PaymentRouter.post('/user/subscribe', auth, PY.CreateUserMonthlySubscriptionCheckOut);



// =============================Companies-Subscription===============================================
PaymentRouter.post('/Company/subscribe', auth, PY.CreateCompanySubscriptionCheckOut);


export default PaymentRouter