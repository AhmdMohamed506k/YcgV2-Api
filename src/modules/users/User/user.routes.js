import { Router } from "express";
import * as us from "./user.controller.js";
import * as AC from "../../Activities/Activity.controller.js";
import { auth } from "../../../middleware/Auth/auth.js";
import { MulterHost,  validExtensions} from "../../../middleware/MulterHost/MulterHost.js";

const UserRouter = Router();





//GOLD =============Register================ !//

UserRouter.post("/Register", us.Register);//* Register

UserRouter.put("/VerfiyUserAccount", us.VerfiyUserAccount);//* VerfiyUserAccount

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
UserRouter.put("/ForgetPassWord", us.ForgetPassWord); //* ForgetPassWord

UserRouter.put("/CheckResetCode", us.CheckResetCode);//* CheckResetCode

UserRouter.put("/ResetPassword", us.ResetPassword);//* ResetPassword

























//====================GlobalApis============================
UserRouter.get("/getAllUsers", us.getAllUsers);


// UserRouter.put("/addLoggedInUserSkills", auth, us.addLoggedInUserSkills);












export default UserRouter;
