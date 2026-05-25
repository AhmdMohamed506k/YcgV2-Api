import { Router } from "express";
import * as us from "./user.controller.js";
import * as AC from "../../Activities/Activity.controller.js";
import { auth } from "../../../middleware/Auth/auth.js";
import { MulterHost,  validExtensions} from "../../../middleware/MulterHost/MulterHost.js";

const UserRouter = Router();





//GOLD =============Register================ !//

UserRouter.post("/Register", us.Register);//* Register

UserRouter.put("/VerifyUserAccount", us.VerifyUserAccount);//* VerifyUserAccount

UserRouter.put("/AddRegisteredUserName", auth, us.AddRegisteredUserName);//* AddRegisteredUserName

UserRouter.put("/AddRegisteredUserLocation", auth, us.AddRegisteredUserLocation);//* AddRegisteredUserLocation

UserRouter.put("/AddRegisteredUserCurrentJob", auth, us.AddRegisteredUserCurrentJob);//* AddRegisteredUserCurrentJob

UserRouter.put("/AddRegisteredUserOtherInformation", auth , MulterHost(validExtensions.image).single("UserProfileImg") , us.AddRegisteredUserOtherInformation);//* AddRegisteredUserOtherInformation


//GOLD ===============Login================ !//

//CYAN2 Create (1)
UserRouter.post("/Login", us.Login);//* Login


//GREEN3 Display (1)
UserRouter.get("/getLoggedUserProfile", auth, us.getLoggedUserProfile);//* getLoggedUserProfile


//YELLOW1 update (3)
UserRouter.put("/updateLoggedInUserPassword", auth, us.updateLoggedInUserPassword);//* updateLoggedInUserPassword

UserRouter.put("/updateLoggedInUserdata", auth, us.updateLoggedInUserdata);//* updateLoggedInUserdata

UserRouter.get("/refresh-status", auth, us.refreshStatus);//* refreshUserStatus


//RED3 ForgetPass (3)
UserRouter.put("/ForgetPassword", us.ForgetPassWord); //* ForgetPassWord

UserRouter.put("/CheckResetCode", us.CheckResetCode);//* CheckResetCode

UserRouter.put("/ResetPassword", us.ResetPassword);//* ResetPassword





//YELLOW2 ===============User-Files================ !//





//GREEN3==>UserCV Methods
UserRouter.post("/UserCv",auth,MulterHost(validExtensions.cv).single("userCV"),us.UploadUserCv);
UserRouter.delete("/DeleteUserCv",auth,us.DeleteUserCv);


//GREEN3==>UserBanner Methods
UserRouter.post("/UploadLoggedInUserBanner",auth, MulterHost(validExtensions.image).single("userBanner"), us.UploadLoggedInUserBanner);
UserRouter.delete("/RemoveOldUserBanner",auth,us.RemoveOldUserBanner);



//GREEN3==>UserProfileImage Methods
UserRouter.post("/UpdateLoggedInUserImageProfile", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.UpdateLoggedInUserImageProfile);
UserRouter.delete("/RemoveOldUserProfileImage",auth,us.RemoveOldUserProfileImage);













//====================GlobalApis============================
UserRouter.get("/getAllUsers", us.getAllUsers);


// UserRouter.put("/addLoggedInUserSkills", auth, us.addLoggedInUserSkills);












export default UserRouter;
