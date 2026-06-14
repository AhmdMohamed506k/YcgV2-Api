import { Router } from "express";
import * as JB from "./Jobs.controller.js"
import { MulterHost, validExtensions } from "../../middleware/MulterHost/MulterHost.js";
import { auth } from "../../middleware/Auth/auth.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";







const JobRouter = Router()


JobRouter.post("/CreateJob",auth,JB.CreateJobPost)//done

JobRouter.patch("/ApplyToJob/:jobId", auth,activeIdentity , MulterHost(validExtensions.cv).single("CurrentUserCv") ,JB.ApplyToJob);




export default JobRouter