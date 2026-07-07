
import { Router } from "express";
import { auth } from "../../../../middleware/Auth/auth.js";
import * as LS from "./LanguagesSection.controller.js"



const LanguageSectionRouter = Router();


LanguageSectionRouter.get("/GetUserLanguage",auth, LS.GetSpecificUserLanguages);

LanguageSectionRouter.post("/AddNewLanguage",auth, LS.AddNewUserLanguageSection);

LanguageSectionRouter.put("/updateUserLanguageData/:_id",auth, LS.updateUserLanguageData);

LanguageSectionRouter.delete("/DeleteUserLanguagesSection/:_id",auth, LS.DeleteUserLanguagesSection);



export default LanguageSectionRouter;


