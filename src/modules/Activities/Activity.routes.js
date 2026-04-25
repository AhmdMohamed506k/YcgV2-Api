import { Router } from "express";
import {auth} from '../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../middleware/MulterHost/MulterHost.js";
import * as UA from "./Activity.controller.js"



const ActivityRouter = Router();



// **** Activities (Interact-Operations) ****



ActivityRouter.patch("/Activities/ActivityToggleLike", auth, UA.ActivityToggleLike);

ActivityRouter.put("/Comments/AddNewComment", auth, UA.addComment);

ActivityRouter.get("/Comments/getPostComments", auth, UA.getPostComments);

ActivityRouter.patch("/Comments/ToggleCommentLike", auth, UA.toggleCommentLike);

ActivityRouter.put("/Comments/UpdateComment", auth, UA.updateComment);

ActivityRouter.delete("/Comments/DeleteComment/:commentId", auth, UA.deleteComment);

ActivityRouter.post("/Activities/RepostActivity", auth, UA.createRepost);




export default ActivityRouter;