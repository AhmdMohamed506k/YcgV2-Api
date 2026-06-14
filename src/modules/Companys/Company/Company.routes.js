import Router from "express";
import {auth} from "../../../middleware/Auth/auth.js"
import * as CP from "./Company.controller.js"
import * as AC from "../../Activities/Activity.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost.js";
const FieldsArray=[ { name: 'Logo', maxCount: 1 }, { name: 'Banner', maxCount: 1 }]



const CompanyRouter = Router()




// !==================================================CompanyCRUD===============================================================

CompanyRouter.post("/CreatePage",auth,MulterHost(validExtensions.image).single("Logo"),CP.CreateCompanyPage);//* CreateCompanyPage

CompanyRouter.get("/Dashboard",auth,CP.GetSpecificCompanyDashBoard);//* GetCompanyDashboard

CompanyRouter.get("/PublicPage/:companyId",auth,CP.getCompanyPublicPage);//* GetCompanyPublicPage

CompanyRouter.put("/UpdateInfo/:companyId",auth,MulterHost(validExtensions.image).fields(FieldsArray),CP.updateCompany)//* UpdateCompanyInfo

CompanyRouter.delete("/DeleteCompany/:companyId", auth , CP.DeleteCompany);//* DeleteCompany









// !==================================================Page_Services===============================================================

CompanyRouter.post("/NewAdminToCompany/:companyId",auth,CP.addAdminToCompany)//done
CompanyRouter.get("/CompanyAdmins/:companyId",auth,CP.GetCurrentCompanyAdmins)//done



CompanyRouter.post("/NewEmployeesToCompany/:companyId",auth,CP.addEmployeesToCompany) //done
CompanyRouter.get("/CompanyEmployees/:companyId",auth,CP.GetCurrentCompanyEmployees) //done






export default CompanyRouter;