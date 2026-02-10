import { Router } from "express";
import {auth} from '../../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../../middleware/MulterHost/MulterHost.js";
import * as UA from "./ActivitySection.controller.js"



const ActivityRouter=Router();

//(CreateActivity - deleteActivity - updateActivity - DisplayActivity)
ActivityRouter.post("Activitys/createTextActivity", auth, UA.createTextActivity);
ActivityRouter.post("Activitys/createImageActivity", auth, MulterHost(validExtensions.image).single("image"), UA.createImageActivity);
ActivityRouter.post("Activitys/createVideoActivity", auth, MulterHost([...validExtensions.image ,...validExtensions.media]).fields([ { name: "video", maxCount: 1 }, { name: "cover", maxCount: 1 }]), UA.createVideoActivity);





//(Like-Comment-Repost)==>

//(Like)==>
ActivityRouter.patch("/Activitys/ActivityToggleLike", auth, UA.ActivityToggleLike);



//(Comment)==>
ActivityRouter.put("/Comments/AddNewComment", auth, UA.addComment);
ActivityRouter.get("/Comments/getPostComments", auth, UA.getPostComments);
ActivityRouter.patch("/Comments/ToggleCommentLike", auth, UA.toggleCommentLike);
ActivityRouter.put("/Comments/UpdateComment", auth, UA.updateComment);
ActivityRouter.delete("/Comments/DeleteComment/:commentId", auth, UA.deleteComment);



//(Repost)==>
ActivityRouter.post("/Activitys/RepostActivity", auth, UA.createRepost);

export default ActivityRouter;