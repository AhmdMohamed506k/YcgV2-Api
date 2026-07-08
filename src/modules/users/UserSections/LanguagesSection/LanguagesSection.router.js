
import { Router } from "express";
import { auth } from "../../../../middleware/auth/auth.js";
import { validate } from "../../../../middleware/validation/validation.js";
import * as LS from "./LanguagesSection.controller.js"
import * as LSV from "./LanguageValidation.js"



const LanguageSectionRouter = Router();


LanguageSectionRouter.get("/GetUserLanguage",auth, LS.GetSpecificUserLanguages);

LanguageSectionRouter.post("/AddNewLanguage",auth,validate(LSV.addLanguage), LS.AddNewUserLanguageSection);

LanguageSectionRouter.put("/updateUserLanguageData/:_id",auth,validate(LSV.updateLanguage), LS.updateUserLanguageData);

LanguageSectionRouter.delete("/DeleteUserLanguage/:_id",auth,validate(LSV.deleteLanguage), LS.DeleteUserLanguagesSection);



export default LanguageSectionRouter;


