import Router from "express";
import {auth} from "../../../middleware/Auth/auth.js"
import * as CP from "./Company.controller.js"
import * as AC from "../../Activities/Activity.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost.js";
const FieldsArray=[ { name: 'Logo', maxCount: 1 }, { name: 'Banner', maxCount: 1 }]



const CompanyRouter = Router()




// !==================================================CompanyCRUD===============================================================

CompanyRouter.post("/CreateCompanyPage",auth,MulterHost(validExtensions.image).single("Logo"),CP.CreateCompanyPage);//* CreateCompanyPage

CompanyRouter.get("/GetCompanyDashboardData",auth,CP.GetSpecificCompanyDashBoard);//* GetCompanyDashboard

CompanyRouter.get("/getCompanyPublicPage/:companyId",auth,CP.getCompanyPublicPage);//* GetCompanyPublicPage

CompanyRouter.put("/UpdateCompanyInfo/:companyId",auth,MulterHost(validExtensions.image).fields(FieldsArray),CP.updateCompany)//* UpdateCompanyInfo

CompanyRouter.delete("/DeleteCompany/:companyId", auth , CP.DeleteCompany);//* DeleteCompany




// !==================================================Page_Services===============================================================

CompanyRouter.post("/AddNewAdmin/:companyId",auth,CP.addAdminToCompany)//done






export default CompanyRouter;