import { Router } from "express";
import {auth} from '../../../../middleware/auth/auth.js';
import { MulterHost,  validExtensions} from "../../../../middleware/multerHost/multerHost.js";
import * as PS from "./ProjectSection.controller.js"
import * as PSV from "./ProjectValidation.js"
import { validate } from "../../../../middleware/validation/validation.js";








const ProjectSectionRouter=Router()


ProjectSectionRouter.get("/GetUserProjects",auth , PS.GetUserProjects);

ProjectSectionRouter.post( "/AddNewProject",auth,
    MulterHost([...validExtensions.media,...validExtensions.image]).fields([
    { name: "Media", maxCount: 1 }, { name: "MediaCoverImage", maxCount: 1 }]),
    validate(PSV.addProject),
    PS.AddUserNewProject);

ProjectSectionRouter.put( "/UpdateProject/:ProjectID",auth,
    MulterHost([...validExtensions.media,...validExtensions.image]).fields([ 
    { name: "Media", maxCount: 1 }, { name: "MediaCoverImage", maxCount: 1 }]),
    validate(PSV.updateProject),
    PS.UpdateSpecificProject);

ProjectSectionRouter.delete("/DeleteProject/:ProjectID",auth,validate(PSV.deleteProject), PS.DeleteSpecificProject);


export default ProjectSectionRouter;