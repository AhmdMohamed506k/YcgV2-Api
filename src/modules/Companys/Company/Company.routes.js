import Router from "express";
import {auth} from "../../../middleware/Auth/auth.js"
import * as CP from "./Company.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost.js";



const CompanysRouter = Router()

CompanysRouter.get("/GetCompanyDashboardData",auth,CP.GetSpeceficCompanyInfo)
CompanysRouter.post("/CreateCompanyPage",auth,MulterHost(validExtensions.image).single("Logo"),CP.CreateCompanyPage)
CompanysRouter.post("/CreateCompanyActivity", auth,MulterHost([...validExtensions.image, ...validExtensions.media]).fields([
        { name: 'image', maxCount: 1 }, 
        { name: 'video', maxCount: 1 }, 
        { name: 'cover', maxCount: 1 },
    ]),  CP.createActivity);
CompanysRouter.put("/UpdateCompanyInfo/:companyId",auth,MulterHost(validExtensions.image).single("Logo"),CP.updateCompany)
CompanysRouter.post("/AddNewAdmin/:companyId",auth,CP.addAdminToCompany)






export default CompanysRouter;