import { Router } from "express";
import {auth} from '../../../../middleware/Auth/auth.js';
import { MulterHost,  validExtensions} from "../../../../middleware/MulterHost/MulterHost.js";
import * as PS from "./ProjectSection.controller.js"

const ProjectSectionRouter=Router()


ProjectSectionRouter.get("/GetUserProjects",auth , PS.GetUserProjects);
ProjectSectionRouter.post( "/AddUserNewProject",auth, MulterHost([...validExtensions.media,...validExtensions.image]).fields([ { name: "Media", maxCount: 1 }, { name: "MediaCoverImage", maxCount: 1 }]),PS.AddUserNewProject);
ProjectSectionRouter.put( "/UpdateSpecificProject/:ProjectID",auth, MulterHost([...validExtensions.media,...validExtensions.image]).fields([ { name: "Media", maxCount: 1 }, { name: "MediaCoverImage", maxCount: 1 }]),PS.UpdateSpecificProject);
ProjectSectionRouter.delete("/DeleteSpecificProject",auth , PS.DeleteSpecificProject);


export default ProjectSectionRouter;