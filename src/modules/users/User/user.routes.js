import { Router } from "express";
import * as us from "./user.controller.js";
import { auth } from "../../../middleware/Auth/auth.js";
import { MulterHost,  validExtensions} from "../../../middleware/MulterHost/MulterHost.js";

const UserRouter = Router();





// ++==========RegisterApi=============++ //

//todo: Register
UserRouter.post("/Register", us.Register);

//todo: VerfiyNewAccount
UserRouter.put("/VerfiyUserAccount", us.VerfiyUserAccount);
UserRouter.put("/AddRegisteredUserName", auth, us.AddRegisteredUserName);
UserRouter.put("/AddRegisteredUserLocation", auth, us.AddRegisteredUserLocation);
UserRouter.put("/AddRegisteredUserCurrentJob", auth, us.AddRegisteredUserCurrentJob);
UserRouter.put("/AddRegisteredUserOtherInformations", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.AddRegisteredUserOtherInformations);




//! =============LoginApi================ !//

//todo: Login
UserRouter.post("/Login", us.Login);

//todo: ForgetPass
UserRouter.put("/ForgetPassWord", us.ForgetPassWord);
UserRouter.put("/CheckResetCode", us.CheckResetCode);
UserRouter.put("/ResetPassword", us.ResetPassword);

//todo: Update User Information 
UserRouter.put("/updateLoggedInUserPassword", auth, us.updateLoggedInUserPassword);
UserRouter.put("/updateLoggedInUserdata", auth, us.updateLoggedInUserdata);

//todo: Get User Profile 
UserRouter.get("/getLoggedinUserProfile", auth, us.getLoggedinUserProfile);
UserRouter.get('/getPeopleYouMayKnow', auth, us.getPeopleYouMayKnow);

// !: Get Home Page :! //
UserRouter.get("/Activitys/Home", auth,us.getHybridFeed);

// todo: Get User activities Page
UserRouter.get("/Activitys/Profiles/:userId", auth,us.getUserActivity);

//todo: Refresh UserS tatus
UserRouter.get("/refresh-status", auth, us.refreshStatus);












//====================GlobalApis============================
UserRouter.get("/getAllUsers", us.getAllUsers);


// UserRouter.put("/addLoggedInUserSkills", auth, us.addLoggedInUserSkills);












export default UserRouter;
