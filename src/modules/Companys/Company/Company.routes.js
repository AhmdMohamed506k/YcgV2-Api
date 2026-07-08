import Router from "express";
import {auth} from "../../../middleware/auth/auth.js"
import * as CP from "./company.controller.js"
import * as CPV from "./company.validation.js"
import * as AC from "../../activities/activity.controller.js"
import { MulterHost, validExtensions } from "../../../middleware/multerHost/multerHost.js";
import { validate } from "../../../middleware/validation/validation.js";

const FieldsArray=[ { name: 'Logo', maxCount: 1 }, { name: 'Banner', maxCount: 1 }]



const CompanyRouter = Router()




// !==================================================CompanyCRUD===============================================================

CompanyRouter.post("/CreatePage",auth,MulterHost(validExtensions.image).single("Logo"),validate(CPV.companyValidation.createCompany),  CP.CreateCompanyPage);//* CreateCompanyPage

CompanyRouter.get("/Dashboard",auth,CP.GetSpecificCompanyDashBoard);//* GetCompanyDashboard

CompanyRouter.get("/PublicPage/:companyId",auth,CP.getCompanyPublicPage);//* GetCompanyPublicPage

CompanyRouter.put("/UpdateInfo/:companyId",auth,MulterHost(validExtensions.image).fields(FieldsArray),validate(CPV.companyValidation.updateCompany),CP.updateCompany)//* UpdateCompanyInfo

CompanyRouter.delete("/DeleteCompany/:companyId", auth,validate(CPV.companyValidation.deleteCompany), CP.DeleteCompany);//* DeleteCompany









// !==================================================Page_Services===============================================================

CompanyRouter.post("/NewAdminToCompany/:companyId",auth,validate(CPV.companyValidation.addAdmin),CP.addAdminToCompany)//done
CompanyRouter.get("/CompanyAdmins/:companyId",auth,CP.GetCurrentCompanyAdmins)//done



CompanyRouter.post("/NewEmployeesToCompany/:companyId",auth,validate(CPV.companyValidation.addEmployee),CP.addEmployeesToCompany) //done
CompanyRouter.get("/CompanyEmployees/:companyId",auth,CP.GetCurrentCompanyEmployees) //done






export default CompanyRouter;