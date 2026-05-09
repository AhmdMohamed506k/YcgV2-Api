import { Router } from "express";
import {auth} from "../../middleware/Auth/auth.js"
import {activeIdentity} from "../../middleware/activeIdentity/activeIdentity.js"
import * as FE from "./Features.controller.js"



const FeaturesRouter = Router()



FeaturesRouter.post('/ToggleFollow', auth,activeIdentity, FE.ToggleFollow);

FeaturesRouter.post('/recordProfileView', auth,activeIdentity, FE.recordProfileView);

FeaturesRouter.get('/getPeopleYouMayKnow', auth, FE.getPeopleYouMayKnow);

export default FeaturesRouter;