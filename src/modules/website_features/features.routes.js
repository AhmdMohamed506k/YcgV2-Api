import {activeIdentity} from "../../middleware/activeIdentity/activeIdentity.js"
import {auth} from "../../middleware/auth/auth.js"
import * as FE from "./features.controller.js"
import { Router } from "express";



const FeaturesRouter = Router()



FeaturesRouter.post('/ToggleFollow', auth,activeIdentity, FE.ToggleFollow);

FeaturesRouter.post('/recordProfileView', auth,activeIdentity, FE.recordProfileView);

FeaturesRouter.get('/getPeopleYouMayKnow', auth, FE.getPeopleYouMayKnow);

export default FeaturesRouter;