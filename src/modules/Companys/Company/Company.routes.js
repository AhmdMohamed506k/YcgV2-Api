import Router from "express";
import {auth} from "../../../middleware/Auth/auth.js"
import * as CP from "./Company.controller.js"
import * as AC from "../../Activities/Activity.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost.js";
const FieldsArray=[ { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'videoCover', maxCount: 1 },]



const CompanyRouter = Router()




// !==================================================CompanyCRUD===============================================================


CompanyRouter.get("/GetCompanyDashboardData",auth,CP.GetSpecificCompanyDashBoard);//* GetCompanyDashboardData

CompanyRouter.post("/CreateCompanyPage",auth,MulterHost(validExtensions.image).single("Logo"),CP.CreateCompanyPage);//* CreateCompanyPage

CompanyRouter.put("/UpdateCompanyInfo/:companyId",auth,MulterHost(validExtensions.image).single("Logo"),CP.updateCompany)//* UpdateCompanyInfo

CompanyRouter.delete("/DeleteCompany/:companyId", auth , CP.deleteCompany);//* DeleteCompany









// !==================================================Page_Services===============================================================

CompanyRouter.post("/AddNewAdmin/:companyId",auth,CP.addAdminToCompany)//done






export default CompanyRouter;