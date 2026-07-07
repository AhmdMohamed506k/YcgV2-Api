import { Router } from "express";
import { auth } from "../../../../middleware/Auth/auth.js";
import * as Es from "./ExperienceSection.controller.js"
import * as Esv from "./ExperienceValidation.js"
import { validate } from "../../../../middleware/Validation/Validation.js";



const ExperienceSectionRouter = Router()



ExperienceSectionRouter.get("/GetUserExperience",auth, Es.GetSpecificUserExperience);

ExperienceSectionRouter.post("/AddNewExperience",auth,validate(Esv.addExperience), Es.AddNewUserExperienceSection);

ExperienceSectionRouter.put("/UpdateExperience/:_id",auth,validate(Esv.updateExperience), Es.updateExperienceData);

ExperienceSectionRouter.delete("/DeleteExperience/:_id",auth,validate(Esv.deleteExperience), Es.DeleteUserExperienceSection);



export default ExperienceSectionRouter;