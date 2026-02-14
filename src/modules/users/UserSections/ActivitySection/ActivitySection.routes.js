import { Router } from "express";
import {auth} from '../../../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../../../middleware/MulterHost/MulterHost.js";
import * as UA from "./ActivitySection.controller.js"



const ActivityRouter=Router();



// ***** Activities (CRUD-Operations) *****

//(Create)==>
ActivityRouter.post("/Activitys/CreateTextActivity", auth, UA.createTextActivity);
ActivityRouter.post("/Activitys/CreateImageActivity", auth, MulterHost(validExtensions.image).single("image"), UA.createImageActivity);
ActivityRouter.post("/Activitys/CreateVideoActivity", auth, MulterHost([...validExtensions.image ,...validExtensions.media]).fields([ { name: "video", maxCount: 1 }, { name: "cover", maxCount: 1 }]), UA.createVideoActivity);
//(Display)==>
ActivityRouter.get("/Activitys/Home", auth,UA.getHybridFeed);
ActivityRouter.get("/Activitys/Profiles/:userId", auth,UA.getUserActivity);
//(Update)==>
ActivityRouter.put("/Activitys/UpdateActivity/:postId", auth, UA.updateActivity);
//(Delete)==>    
ActivityRouter.delete("/Activitys/DeleteActivity/:postId", auth, UA.deleteActivity);



/////////////////////////////////////////////////////////////////






// **** Activities (Interact-Operations) ****


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