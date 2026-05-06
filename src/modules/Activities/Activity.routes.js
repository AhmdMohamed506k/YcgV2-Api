import { Router } from "express";
import {auth} from '../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../middleware/MulterHost/MulterHost.js";
import * as AC from "./Activity.controller.js"
const FieldsArray=[ { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'videoCover', maxCount: 1 },]



const ActivityRouter = Router();


//RED1========================================CRUD===================================================================///




//YELLOW2 ====> Create (1)
ActivityRouter.post("/createActivity", auth,MulterHost([...validExtensions.image, ...validExtensions.media]).fields(FieldsArray), AC.CreateActivity);



//GREEN3 ====> Display (3)

ActivityRouter.get("/Home", auth,AC.getHybridFeed);

ActivityRouter.get("/GetAllActivities/:OwnerId",auth,AC.GetActivities)

ActivityRouter.get("/Profiles/ActivityDetails/:activityId", auth,AC.GetSpecificActivityInfo);



//CYAN2 ===>  Update (1)
ActivityRouter.put("/Profiles/ChangeActivityDetails/:ActivityId", auth,AC.UpdateActivity);


//RED3 ===>  Delete (1)
ActivityRouter.delete("/Profiles/DeleteActivity/:activityId", auth,AC.DeleteActivity);





//RED1========================================Interact-Operations======================================================///




//YELLOW1 ====> Like (1)

ActivityRouter.patch("/ActivityToggleLike", auth, AC.ActivityToggleLike);  // ✅

//YELLOW1===============> 



//ORANGE1 ===> Comment (6)

//WHITE: Create(2)
ActivityRouter.put("/AddNewComment", auth, AC.AddComment); // ✅

ActivityRouter.patch("/Comment/ToggleCommentLike", auth, AC.ToggleCommentLike);  // ✅

//GREEN3: Display(1)
ActivityRouter.get("/Comments/getPostComments", auth, AC.GetPostComments); //✅

//CYAN1: Update(1)
ActivityRouter.put("/Comment/UpdateComment", auth, AC.UpdateComment);//✅

//RED3: Delete(1)
ActivityRouter.delete("/Comments/DeleteComment/:commentId", auth, AC.DeleteComment);

//ORANGE1==========================>



//LIME ===> Repost(1)

ActivityRouter.post("/Activities/RepostActivity", auth, AC.CreateRepost);

//LIME =========================> 






export default ActivityRouter;