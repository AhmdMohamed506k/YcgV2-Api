import { Router } from "express";
import {auth} from '../../middleware/auth/auth.js';

import { MulterHost,  validExtensions} from "../../middleware/multerHost/multerHost.js";
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";
import { validate } from "../../middleware/validation/validation.js";

import * as AC from "./activity.controller.js"
import * as ACV from "./activity.validation.js"

const FieldsArray=[ { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'videoCover', maxCount: 1 },]



const ActivityRouter = Router();


//RED1========================================CRUD===================================================================///




//YELLOW2 ====> Create (1)
ActivityRouter.post("/createActivity", auth, activeIdentity,MulterHost([...validExtensions.image, ...validExtensions.media]).fields(FieldsArray),validate(ACV.activityValidation.createActivity),AC.CreateActivity);



//GREEN3 ====> Display (3)
ActivityRouter.get("/Home", auth,AC.getHybridFeed);
ActivityRouter.get("/GetAllActivities/:OwnerId",auth,AC.GetAllUserActivities);
ActivityRouter.get("/Profiles/ActivityDetails/:activityId", auth,activeIdentity,AC.GetSpecificActivityInfo);
ActivityRouter.get("/ActivityAnalytics/ActivitySummery/:activityId", auth,activeIdentity,AC.GetActivityAnalytics);



//CYAN2 ===>  Update (1)
ActivityRouter.put("/Profiles/ChangeActivityDetails/:activityId", auth,activeIdentity,MulterHost([...validExtensions.image, ...validExtensions.media]).fields(FieldsArray),validate(ACV.activityValidation.updateActivity), AC.UpdateActivity);


//RED3 ===>  Delete (1)
ActivityRouter.delete("/Profiles/DeleteActivity/:activityId",auth,activeIdentity, AC.DeleteActivity);





//RED1========================================Interact-Operations======================================================///




//YELLOW1 ====> Like (1)

ActivityRouter.patch("/ActivityToggleLike", auth, activeIdentity,validate(ACV.activityValidation.toggleLike), AC.ActivityToggleLike);  // ✅

//YELLOW1===============> 



//ORANGE1 ===> Comment (6)

//WHITE: Create(2)
ActivityRouter.put("/AddNewComment", auth,activeIdentity,validate(ACV.activityValidation.addComment), AC.AddComment); // ✅
ActivityRouter.patch("/Comment/ToggleCommentLike", auth,activeIdentity, AC.CommentToggleLike);  // ✅

//GREEN3: Display(1)
ActivityRouter.get("/Comments/getPostComments", auth, AC.GetPostComments); //✅

//CYAN1: Update(1)
ActivityRouter.put("/Comment/UpdateComment", auth,activeIdentity,validate(ACV.activityValidation.updateComment), AC.UpdateComment);//✅

//RED3: Delete(1)
ActivityRouter.delete("/Comments/DeleteComment/:commentId", auth,activeIdentity,validate(ACV.activityValidation.deleteComment), AC.DeleteComment);

//ORANGE1==========================>



//LIME ===> Repost(1)
ActivityRouter.post("/repost/RepostActivity", auth,activeIdentity, AC.ActivityRepost);

//LIME =========================> 






export default ActivityRouter;