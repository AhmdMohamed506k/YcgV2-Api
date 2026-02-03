import { Router } from "express";
import { auth } from "../../../middleware/Auth/auth.js";
import * as AbSection from './AboutSection.controller.js'



const AboutSectionRouter= Router()




AboutSectionRouter.get("/GetSpecificUserAboutSection", auth , AbSection.GetSpecificUserAboutSection);
AboutSectionRouter.post("/AddNewUserAboutSection", auth , AbSection.AddNewUserAboutSection);
AboutSectionRouter.put("/updatAboutSectionData/:_id", auth , AbSection.updatAboutSectionData);
AboutSectionRouter.delete("/DeletUserAboutSection/:_id", auth , AbSection.DeletUserAboutSection);




export default AboutSectionRouter;