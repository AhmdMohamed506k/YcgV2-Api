import { Router } from "express";
import { auth } from "../../../../middleware/auth/auth.js";
import * as ED from "./EducationSection.controller.js"
import * as EDV from "./EducationValidation.js"
import { validate } from "../../../../middleware/validation/validation.js";



const EducationSectionRouter= Router()


EducationSectionRouter.get("/GetUserEducationSection",auth, ED.GetSpecificUserEducationSection);

EducationSectionRouter.post("/AddNewEducation", auth,validate(EDV.AddEducation), ED.AddUserNewEducationField);

EducationSectionRouter.put("/updateEducation/:_id",auth,validate(EDV.UpdateEducation), ED.updateEducationData);

EducationSectionRouter.delete("/DeleteEducationSection/:_id",auth,validate(EDV.DeleteEducation), ED.DeleteUserEducationSection);



export default EducationSectionRouter;