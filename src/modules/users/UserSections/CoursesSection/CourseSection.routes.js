import { Router } from "express";
import * as CS from "./CourseSection.controller.js"
import * as CSV from "./CoursesSectionValidation.js"
import { auth } from "../../../../middleware/auth/auth.js";
import { validate } from "../../../../middleware/validation/validation.js";





const CourseSectionRouter= Router();

CourseSectionRouter.get("/GetUserCourses",auth,CS.GetUserCourseSection);

CourseSectionRouter.post("/AddNewCourse",auth,validate(CSV.addCourse),CS.AddNewUserCourseSection);

CourseSectionRouter.put("/UpdateCourse/:courseId" ,auth,validate(CSV.updateCourse),validate(CSV),CS.UpdateUserCourseData);

CourseSectionRouter.delete("/DeleteCourse/:_id" ,auth,validate(CSV.deleteCourse),CS.DeleteUserCourse);




export default CourseSectionRouter;