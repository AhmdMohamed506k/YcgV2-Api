import Router from 'express'
import { auth } from "../../../../middleware/auth/auth.js";
import * as Sk from './SkillsSection.controller.js'
import * as SKV from './SkillsValidation.js'
import { validate } from "../../../../middleware/validation/validation.js";






const SkillsSectionRouter = Router();




SkillsSectionRouter.get("/GetUserSkills", auth , Sk.GetSkills);

SkillsSectionRouter.post("/AddNewSkill", auth ,validate(SKV.addSkill), Sk.AddSkill);

SkillsSectionRouter.put("/UpdateUserSkill/:skillId", auth ,validate(SKV.updateSkill), Sk.UpdateSkill);

SkillsSectionRouter.delete("/DeleteUserSkill/:skillId", auth ,validate(SKV.deleteSkill), Sk.DeleteSkill);


export default SkillsSectionRouter




