import { Router } from "express";
import {auth} from '../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../middleware/MulterHost/MulterHost.js";
import * as AC from "./Activity.controller.js"
import { activeIdentity } from "../../middleware/activeIdentity/activeIdentity.js";
const FieldsArray=[ { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'videoCover', maxCount: 1 },]



const ActivityRouter = Router();


//RED1========================================CRUD===================================================================///




//YELLOW2 ====> Create (1)
ActivityRouter.post("/createActivity", auth, activeIdentity,MulterHost([...validExtensions.image, ...validExtensions.media]).fields(FieldsArray), AC.CreateActivity);



//GREEN3 ====> Display (3)
ActivityRouter.get("/Home", auth,AC.getHybridFeed);
ActivityRouter.get("/GetAllActivities/:OwnerId",auth,AC.GetAllUserActivities);
ActivityRouter.get("/Profiles/ActivityDetails/:activityId", auth,activeIdentity,AC.GetSpecificActivityInfo);



//CYAN2 ===>  Update (1)
ActivityRouter.put("/Profiles/ChangeActivityDetails/:activityId", auth,activeIdentity,MulterHost([...validExtensions.image, ...validExtensions.media]).fields(FieldsArray), AC.UpdateActivity);


//RED3 ===>  Delete (1)
ActivityRouter.delete("/Profiles/DeleteActivity/:activityId",auth,activeIdentity, AC.DeleteActivity);





//RED1========================================Interact-Operations======================================================///




//YELLOW1 ====> Like (1)

ActivityRouter.patch("/ActivityToggleLike", auth, activeIdentity, AC.ActivityToggleLike);  // ✅

//YELLOW1===============> 



//ORANGE1 ===> Comment (6)

//WHITE: Create(2)
ActivityRouter.put("/AddNewComment", auth,activeIdentity, AC.AddComment); // ✅
ActivityRouter.patch("/Comment/ToggleCommentLike", auth,activeIdentity, AC.CommentToggleLike);  // ✅

//GREEN3: Display(1)
ActivityRouter.get("/Comments/getPostComments", auth, AC.GetPostComments); //✅

//CYAN1: Update(1)
ActivityRouter.put("/Comment/UpdateComment", auth,activeIdentity, AC.UpdateComment);//✅

//RED3: Delete(1)
ActivityRouter.delete("/Comments/DeleteComment/:commentId", auth,activeIdentity, AC.DeleteComment);

//ORANGE1==========================>



//LIME ===> Repost(1)
ActivityRouter.post("/repost/RepostActivity", auth,activeIdentity, AC.ActivityRepost);

//LIME =========================> 






export default ActivityRouter;