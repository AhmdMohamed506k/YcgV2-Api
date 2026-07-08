


// middleware/identity.middleware.js

import companyModel from "../../../DB/models/company/company.model.js";
import { asyncHandler } from "../asyncHandler/asyncHandler.js";

export const activeIdentity = asyncHandler(async (req, res, next) => {

    const activeId = req.headers['x-active-identity']; 
    
  
    if (!activeId || activeId === 'user') {
        req.identity = {
            id: req.user._id,
            type: 'user',
            name: `${req.user.firstName} ${req.user.lastName}`,
            img: req.user.userProfileImg?.secure_url
        };
        return next();
    }

   
    const company = await companyModel.findOne({  _id: activeId, "Admins.user": req.user._id });
    if (!company) {
        return next(new Error("You are not authorized to act on behalf of this company", { cause: 403 }));
    }
    
    
    req.identity = {
        id: company._id,
        type: 'Company',
        name: company.CompanyName,
        img: company.Logo?.secure_url
    };

    next();
});