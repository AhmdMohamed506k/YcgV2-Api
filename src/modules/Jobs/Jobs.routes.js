import { Router } from "express";
import * as JB from "./Jobs.controller.js"
import { MulterHost, validExtensions } from "../../middleware/MulterHost/MulterHost.js";
import { auth } from "../../middleware/Auth/auth.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";







const JobRouter = Router();


// ====================================JobPostCRUD====================================================
JobRouter.get("/JobPublicPage/:JobPostId",auth,JB.GetJobPostPublicPage)//done

JobRouter.post("/CreateJob",auth,JB.CreateJobPost)//done

JobRouter.put("/UpdateJob",auth,JB.UpdatePostedJobPost)//done

JobRouter.delete("/DeleteJob/:JobPostId",auth,JB.DeleteSpecificJobPost)//done




// ====================================JobPostsOperations====================================================


JobRouter.get("/getJobs" ,auth,JB.getAllJobsOrSearchForJob)//done













export default JobRouter