import { Router } from "express";
import * as AP from "./Application.controller.js"
import { MulterHost, validExtensions } from "../../middleware/MulterHost/MulterHost.js";
import { auth } from "../../middleware/Auth/auth.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";







const ApplicationRouter = Router();


ApplicationRouter.post("/job/ApplyToJob/:jobId", auth,activeIdentity , MulterHost(validExtensions.cv).single("CurrentUserCv") ,AP.ApplyToJob);

ApplicationRouter.get("/job/ApplicationsList/:jobId",auth,AP.GetJobApplications)//done

ApplicationRouter.get("/job/ApplicationDetails/:applicationId",auth,AP.GetApplicationDetails)//done

ApplicationRouter.put("/job/Response/:applicationId",auth,AP.ReviewAndRespondToApplication)//done













export default ApplicationRouter

