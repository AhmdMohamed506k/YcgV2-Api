import { Router } from "express";
import { auth } from "../../../../middleware/Auth/auth.js";
import * as ED from "./EducationSection.controller.js"



const EducationSectionRouter= Router()


EducationSectionRouter.get("/GetSpecificUserEductationSection",auth, ED.GetSpecificUserEductationSection);
EducationSectionRouter.post("/AddUserNewEducationField", auth, ED.AddUserNewEducationField);

EducationSectionRouter.put("/updateEducationData/:_id",auth, ED.updateEducationData);
EducationSectionRouter.delete("/DeleteUserEductationSection/:_id",auth, ED.DeleteUserEductationSection);



export default EducationSectionRouter;