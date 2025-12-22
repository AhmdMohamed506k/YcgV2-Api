import { Router } from "express";
import { auth } from "../../../middleware/Auth/auth.js";
import * as Es from "./ExperienceSection.controller.js"







const ExperienceSectionRouter= Router()

ExperienceSectionRouter.get("/GetUserExperience",auth, Es.GetSpecificUserExperienc);


ExperienceSectionRouter.put("/addUserExperienceSection",auth, Es.newUserExperiencSection);


ExperienceSectionRouter.put("/updatExperiencData/:_id",auth, Es.updatExperiencData);


ExperienceSectionRouter.delete("/DeletUserExperienceSection/:_id",auth, Es.DeletUserExperienceSection);












export default ExperienceSectionRouter;