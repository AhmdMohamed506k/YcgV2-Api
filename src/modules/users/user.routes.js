import { Router } from "express";
import * as us from "./user.controller.js";
import { auth } from "../../middleware/Auth/auth.js";
import { MulterHost,  validExtensions} from "../../middleware/MulterHost/MulterHost.js";

const router = Router();





// ++==========RegisterApi=============++ //

//==>POST METHODS
router.post("/Register", us.Register);

//==>PUT METHODS
router.put("/VerfiyUserAccount", us.VerfiyUserAccount);
router.put("/AddRegisteredUserName", auth, us.AddRegisteredUserName);
router.put("/AddRegisteredUserLocation", auth, us.AddRegisteredUserLocation);
router.put("/AddRegisteredUserCurrentJob", auth, us.AddRegisteredUserCurrentJob);
router.put("/AddRegisteredUserOtherInformations", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.AddRegisteredUserOtherInformations);




// ++=============LoginApi================++ //

//==>POST METHODS
router.post("/Login", us.Login);


//==>ForgetPass Methods
router.put("/ForgetPassWord", us.ForgetPassWord);
router.put("/CheckResetCode", us.CheckResetCode);
router.put("/ResetPassword", us.ResetPassword);

//==>UserCV Methods
router.put("/UploadLoggedInUserCv",auth, MulterHost(validExtensions.cv).single("userCV"), us.UploadLoggedInUserCv);
router.delete("/RemoveOldUserCV",auth,us.RemoveOldUserCV);

//==>UserBanner Methods
router.put("/UploadLoggedInUserBanner",auth, MulterHost(validExtensions.image).single("userBanner"), us.UploadLoggedInUserBanner);
router.delete("/RemoveOldUserBanner",auth,us.RemoveOldUserBanner);

//==>UserProfileImage Methods
router.put("/UpdateLoggedInUserImageProfile", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.UpdateLoggedInUserImageProfile);
router.delete("/RemoveOldUserProfileImage",auth,us.RemoveOldUserProfileImage);


//==> Update_User_Information Methods
router.put("/updateLoggedInUserPassword", auth, us.updateLoggedInUserPassword);
router.put("/updateLoggedInUserdata", auth, us.updateLoggedInUserdata);



//==>User Profile METHODS
router.get("/getLoggedinUserProfile", auth, us.getLoggedinUserProfile);
router.get('/getPeopleYouMayKnow', auth, us.getPeopleYouMayKnow);
router.post('/recordProfileView', auth, us.recordProfileView);
router.get('/getMyViewers', auth, us.getMyViewers);




//==>Follow METHODS
router.post('/followUser', auth, us.followUser);
router.delete('/unfollowUser', auth, us.unfollowUser);





router.put("/addLoggedInUserSkills", auth, us.addLoggedInUserSkills);

//====================GlobalApis============================
router.get("/getAllUsers", us.getAllUsers);














export default router;
