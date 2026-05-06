import UserRouter from "../User/user.routes";
import { auth } from "../../../middleware/Auth/auth";
import { MulterHost, validExtensions } from "../../../middleware/MulterHost/MulterHost";
import * as us from "../User/user.controller.js";







//GREEN3==>UserCV Methods
UserRouter.put("/UploadLoggedInUserCv",auth, MulterHost(validExtensions.cv).single("userCV"), us.UploadLoggedInUserCv);
UserRouter.delete("/RemoveOldUserCV",auth,us.RemoveOldUserCV);



//GREEN3==>UserBanner Methods
UserRouter.put("/UploadLoggedInUserBanner",auth, MulterHost(validExtensions.image).single("userBanner"), us.UploadLoggedInUserBanner);
UserRouter.delete("/RemoveOldUserBanner",auth,us.RemoveOldUserBanner);



//GREEN3==>UserProfileImage Methods
UserRouter.put("/UpdateLoggedInUserImageProfile", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.UpdateLoggedInUserImageProfile);
UserRouter.delete("/RemoveOldUserProfileImage",auth,us.RemoveOldUserProfileImage);
