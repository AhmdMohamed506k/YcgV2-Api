import Router from "express";
import {auth} from "../../../middleware/Auth/auth.js"
import * as CP from "./Company.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost.js";



const CompanysRouter = Router()


// Company_Page_CRUD
CompanysRouter.get("/GetCompanyDashboardData",auth,CP.GetSpeceficCompanyDashBoard);//done
CompanysRouter.post("/CreateCompanyPage",auth,MulterHost(validExtensions.image).single("Logo"),CP.CreateCompanyPage);//done
CompanysRouter.put("/UpdateCompanyInfo/:companyId",auth,MulterHost(validExtensions.image).single("Logo"),CP.updateCompany)//done
CompanysRouter.delete("/DeleteCompany/:companyId", auth , CP.deleteCompany);
//////////////


// Company_Page_activity
CompanysRouter.get( "/GetallActivities/:companyId",auth, CP.getAllCompanyActivities); //done
CompanysRouter.get( "/GetSpecificActivitiesInfo",auth, CP.getSpecificCompanyActivityInfo);
CompanysRouter.post("/CreateCompanyActivity", auth,MulterHost([...validExtensions.image, ...validExtensions.media]).fields([{ name: 'image', maxCount: 1 },{ name: 'video', maxCount: 1 },{ name: 'cover', maxCount: 1 }, ]),  CP.createActivity);//done
CompanysRouter.patch( "/UpdateCompanyActivity/:activityId",auth, CP.updateSpecificActivityInfo);//done
CompanysRouter.delete("/DeleteCompanyActivity/:activityId",auth, CP.DeleteActivity);//done
///////////



// Page_Services
CompanysRouter.post("/AddNewAdmin/:companyId",auth,CP.addAdminToCompany)//done






export default CompanysRouter;