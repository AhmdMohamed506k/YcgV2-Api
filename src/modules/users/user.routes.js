import { Router } from "express";
import * as us from "./user.controller.js";
import { auth } from "../../middleware/auth/auth.js";
import {
  MulterHost,
  validExtensions,
} from "../../middleware/MulterHost/MulterHost.js";

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
router.get("/getLoggedinUserProfile", auth, us.getLoggedinUserProfile);
router.put("/UploadLoggedInUserCv",auth, MulterHost(validExtensions.cv).single("userCV"), us.UploadLoggedInUserCv);










//================================================
router.get("/getAllUsers", us.getAllUsers);


router.put(
  "/UploadUserImage",
  MulterHost([...validExtensions.image]).single("image"),
  auth,
  us.UploadUserImage
);

router.put("/addUserSkills", auth, us.addUserSkills);

router.put("/addUserNewEducationFeild", auth, us.addUserNewEducationFeild);



//================================================

router.put("/updateAccount", auth, us.updateAccount);
router.put("/updatePassword", auth, us.updatePassword);

export default router;
