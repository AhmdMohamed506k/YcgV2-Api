import { MulterHost, validExtensions } from "../../middleware/multerHost/multerHost.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";
import { validate } from "../../middleware/validation/validation.js";
import { auth } from "../../middleware/auth/auth.js";
import { Router } from "express";


import * as AP from "./application.controller.js"
import * as APV from "./application.validation.js"





const ApplicationRouter = Router();


ApplicationRouter.post("/job/ApplyToJob/:jobId", auth,activeIdentity , MulterHost(validExtensions.cv).single("CurrentUserCv"), validate(APV.applicationValidation.applyToJob),  AP.ApplyToJob);

ApplicationRouter.get("/job/ApplicationsList/:jobId",auth,validate(APV.applicationValidation.GetJobApplications),  AP.GetJobApplications)//done

ApplicationRouter.get("/job/ApplicationDetails/:applicationId",auth,validate(APV.applicationValidation.GetApplicationDetails), AP.GetApplicationDetails)//done

ApplicationRouter.put("/job/Response/:applicationId",auth, validate(APV.applicationValidation.reviewApplication), AP.ReviewAndRespondToApplication)//done













export default ApplicationRouter

