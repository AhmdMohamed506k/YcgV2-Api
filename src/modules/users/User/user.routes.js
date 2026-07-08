import { Router } from "express";
import * as us from "./user.controller.js";
import * as USV from "./user_validation.js";
import * as AC from "../../activities/activity.controller.js";
import { auth } from "../../../middleware/auth/auth.js";
import { MulterHost,  validExtensions} from "../../../middleware/multerHost/multerHost.js";
import { validate } from "../../../middleware/validation/validation.js";

const UserRouter = Router();





//GOLD =============Register================ !//

UserRouter.post("/Register",validate(USV.register), us.Register);//* Register

UserRouter.put("/VerifyUserAccount",validate(USV.verifyAccount),us.VerifyUserAccount);//* VerifyUserAccount

UserRouter.put("/AddRegisteredUserName", auth,validate(USV.AddRegisteredUserName), us.AddRegisteredUserName);//* AddRegisteredUserName

UserRouter.put("/AddRegisteredUserLocation", auth,validate(USV.AddRegisteredUserLocation), us.AddRegisteredUserLocation);//* AddRegisteredUserLocation

UserRouter.put("/AddRegisteredUserCurrentJob", auth,validate(USV.AddRegisteredUserCurrentJob), us.AddRegisteredUserCurrentJob);//* AddRegisteredUserCurrentJob

UserRouter.put("/AddRegisteredUserOtherInformation", auth , MulterHost(validExtensions.image).single("UserProfileImg"),validate(USV.addUserOtherInfo), us.AddRegisteredUserOtherInformation);//* AddRegisteredUserOtherInformation


//GOLD ===============Login================ !//

//CYAN2 Create (1)
UserRouter.post("/Login",validate(USV.login), us.Login);//* Login


//GREEN3 Display (1)
UserRouter.get("/getLoggedUserProfile", auth, us.getLoggedUserProfile);//* getLoggedUserProfile


//YELLOW1 update (3)
UserRouter.put("/updateLoggedInUserPassword", auth,validate(USV.updateProfile), us.updateLoggedInUserPassword);//* updateLoggedInUserPassword
UserRouter.put("/updateLoggedInUserdata", auth,validate(USV.updatePassword), us.updateLoggedInUserdata);//* updateLoggedInUserdata
UserRouter.get("/refresh-status", auth, us.refreshStatus);//* refreshUserStatus


//RED3 ForgetPass (3)
UserRouter.put("/ForgetPassword",validate(USV.forgetPassword), us.ForgetPassWord); //* ForgetPassWord
UserRouter.put("/CheckResetCode",validate(USV.checkResetCode), us.CheckResetCode);//* CheckResetCode
UserRouter.put("/ResetPassword",validate(USV.resetPassword), us.ResetPassword);//* ResetPassword





//YELLOW2 ===============User-Files================ !//


//GREEN3==>UserCV Methods
UserRouter.post("/UserCv",auth,MulterHost(validExtensions.cv).single("userCV"),validate(USV.uploadCV),us.UploadUserCv);
UserRouter.delete("/DeleteUserCv",auth,validate(USV.deleteCV),us.DeleteUserCv);
UserRouter.get("/GetUserCv",auth,us.GetUserCvs);


//GREEN3==>UserBanner Methods
UserRouter.patch("/ToggleUpdateUserBanner",auth, MulterHost(validExtensions.image).single("userBanner"),us.ToggleUpdateUserBanner);

//GREEN3==>UserProfileImage Methods
UserRouter.patch("/ToggleUpdateUserProfileImage", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,us.ToggleUpdateUserProfileImage);














//====================GlobalApis============================
UserRouter.get("/getAllUsers", us.getAllUsers);


// UserRouter.put("/addLoggedInUserSkills", auth, us.addLoggedInUserSkills);












export default UserRouter;
