import { Router } from "express";
import {auth} from "../../middleware/Auth/auth.js"
import * as FE from "./Features.controller.js"



const FeaturesRouter = Router()



FeaturesRouter.post('/ToggleFollow', auth, FE.ToggleFollow);

FeaturesRouter.post('/recordProfileView', auth, FE.recordProfileView);

FeaturesRouter.get('/getPeopleYouMayKnow', auth, FE.getPeopleYouMayKnow);

export default FeaturesRouter;