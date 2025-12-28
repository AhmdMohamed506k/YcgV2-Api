import { Router } from "express";
import * as us from "./user.controller.js";
import { auth } from "../../middleware/auth/auth.js";
import { MulterHost,  validExtensions} from "../../middleware/MulterHost/MulterHost.js";

const router = Router();

// =======RegisterApi=============
router.post("/Register", us.Register);
router.put("/VerfiyUserAccount",auth, us.VerfiyUserAccount);
router.put("/AddRegisteredUserName", auth, us.AddRegisteredUserName);
router.put("/AddRegisteredUserLocation", auth, us.AddRegisteredUserLocation);
router.put("/AddRegisteredUserCurrentJob", auth, us.AddRegisteredUserCurrentJob);
router.put("/AddRegisteredUserOtherInformations", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.AddRegisteredUserOtherInformations);

// =======LoginApi=============
router.post("/Login", us.Login);
router.put("/ForgetPassWord", us.ForgetPassWord);
router.put("/CheckResetCode", us.CheckResetCode);
router.put("/ResetPassword", us.ResetPassword);
router.get("/getLoggedinUserProfile", auth, us.getLoggedinUserProfile);
router.put("/UploadLoggedInUserCv",auth, MulterHost(validExtensions.cv).single("userCV"), us.UploadLoggedInUserCv);
router.put("/UploadLoggedInUserBanner",auth, MulterHost(validExtensions.image).single("userBanner"), us.UploadLoggedInUserBanner);
router.put("/UpdateLoggedInUserImageProfile", auth , MulterHost(validExtensions.image).single("UserProfileImg") ,  us.UpdateLoggedInUserImageProfile);
router.put("/updateLoggedInUserdata", auth, us.updateLoggedInUserdata);









//================================================
router.get("/getAllUsers", us.getAllUsers);




router.put("/addUserSkills", auth, us.addUserSkills);

router.put("/addUserNewEducationFeild", auth, us.addUserNewEducationFeild);



//================================================


router.put("/updatePassword", auth, us.updatePassword);

export default router;
