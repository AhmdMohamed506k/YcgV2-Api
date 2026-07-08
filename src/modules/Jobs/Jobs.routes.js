import { Router } from "express";
import * as JB from "./jobs.controller.js"
import * as JBV from "./job.validation.js"
import { MulterHost, validExtensions } from "../../middleware/multerHost/multerHost.js";
import { auth } from "../../middleware/auth/auth.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";
import { validate } from "../../middleware/validation/validation.js";








const JobRouter = Router();


// ====================================JobPostCRUD====================================================
JobRouter.get("/JobPublicPage/:JobPostId",auth,validate(JBV.jobValidation.getJobById),    JB.GetJobPostPublicPage)//done

JobRouter.post("/CreateJob",auth,validate(JBV.jobValidation.createJob),   JB.CreateJobPost)//done

JobRouter.put("/UpdateJob",auth, validate(JBV.jobValidation.updateJob), JB.UpdatePostedJobPost)//done

JobRouter.delete("/DeleteJob/:JobPostId",auth, validate(JBV.jobValidation.DeleteJob),   JB.DeleteSpecificJobPost)//done




// ====================================JobPostsOperations====================================================


JobRouter.get("/getJobs" ,auth,JB.getAllJobsOrSearchForJob)//done













export default JobRouter