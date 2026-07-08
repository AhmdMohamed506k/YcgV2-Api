import { Router } from "express";
import { auth } from "../../../../middleware/auth/auth.js";
import * as AbSection from './AboutSection.controller.js'
import * as AbsValidation from './AboutSectionValidation.js'
import { validate } from "../../../../middleware/validation/validation.js";



const AboutSectionRouter= Router()




AboutSectionRouter.get("/GetAboutUser", auth ,validate(), AbSection.GetSpecificUserAboutSection);

AboutSectionRouter.post("/AddAboutSection", auth ,validate(AbsValidation.addAboutSection), AbSection.AddNewUserAboutSection);

AboutSectionRouter.put("/UpdateAboutSection", auth ,validate(AbsValidation.updateAboutSection), AbSection.updateAboutSectionData);

AboutSectionRouter.delete("/DeleteAboutSection", auth ,validate(AbsValidation.deleteAboutSection), AbSection.DeleteUserAboutSection);




export default AboutSectionRouter;