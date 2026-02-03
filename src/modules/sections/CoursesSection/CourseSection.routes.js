import { Router } from "express";
import * as CS from "./CourseSection.controller.js"
import { auth } from "../../../middleware/Auth/auth.js";





const CourseSectionRouter= Router();


CourseSectionRouter.post("/AddNewUserCourseSection",auth ,CS.AddNewUserCourseSection)
CourseSectionRouter.get("/GetUserCourseSection",auth,CS.GetUserCourseSection)
CourseSectionRouter.put("/UpdateUserCourseData/:coursId" ,auth,CS.UpdateUserCourseData)
CourseSectionRouter.delete("/DeleteUserCourse/:_id" ,auth,CS.DeleteUserCourse)




export default CourseSectionRouter;