import { Router } from "express";
import {auth} from '../../../../middleware/Auth/auth.js';

import * as LC from "./LicensesAndcertifications.controller.js"
import { MulterHost, validExtensions } from "../../../../middleware/MulterHost/MulterHost.js";





const LicensesAndcertificationsRouter= Router();

LicensesAndcertificationsRouter.get("/GetUserLicenses",auth ,LC.GetUserLicenses);
LicensesAndcertificationsRouter.post('/AddLicensesAndcertifications', auth , MulterHost(validExtensions.image).single("CertificationImage") , LC.AddLicensesAndcertifications);
LicensesAndcertificationsRouter.put('/UpdateUserLicenseByID/:id', auth , MulterHost(validExtensions.image).single("CertificationImage") , LC.UpdateUserLicenseByID);
LicensesAndcertificationsRouter.delete("/DeleteUserLicenseById/:id",auth ,LC.DeleteUserLicenseById);





export default LicensesAndcertificationsRouter;