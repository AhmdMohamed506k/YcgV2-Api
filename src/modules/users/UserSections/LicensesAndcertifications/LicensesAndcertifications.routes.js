import { Router } from "express";
import {auth} from '../../../../middleware/auth/auth.js';
import * as LC from "./LicensesAndcertifications.controller.js"
import * as LCV from "./LicensesValidation.js"
import { validate } from "../../../../middleware/validation/validation.js";

import { MulterHost, validExtensions } from "../../../../middleware/multerHost/multerHost.js";





const LicensesAndCertificationsRouter = Router();

LicensesAndCertificationsRouter.get("/GetUserLicenses",auth ,LC.GetUserLicenses);

LicensesAndCertificationsRouter.post('/AddNewLicenseOrCertification', auth , MulterHost(validExtensions.image).single("CertificationImage"),validate(LCV.addLicense), LC.AddLicensesAndcertifications);

LicensesAndCertificationsRouter.put('/UpdateLicense/:id', auth , MulterHost(validExtensions.image).single("CertificationImage"),validate(LCV.updateLicense), LC.UpdateUserLicenseByID);

LicensesAndCertificationsRouter.delete("/DeleteLicense/:id",auth,validate(LCV.deleteLicense), LC.DeleteUserLicenseById);





export default LicensesAndCertificationsRouter;