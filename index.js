
import 'dotenv/config'
import express from "express";
import connectionDB from "./DB/contectionDB.js";
import cors from "cors";
import UserRouter from "./src/modules/users/User/user.routes.js";
import ExperienceSectionRouter from "./src/modules/users/UserSections/ExperienceSection/ExperienceSection.routes.js";
import AboutSectionRouter from "./src/modules/users/UserSections/AboutSection/AboutSection.routes.js";
import EducationSectionRouter from "./src/modules/users/UserSections/EducationSection/EducationSection.routes.js";
import LanguageSectionRouter from "./src/modules/users/UserSections/LanguagesSection/LanguagesSection.router.js";
import CourseSectionRouter from "./src/modules/users/UserSections/CoursesSection/CourseSection.routes.js";
import ProjectSectionRouter from "./src/modules/users/UserSections/ProjectSection/ProjectSection.routes.js";
import LicensesAndcertificationsRouter from "./src/modules/users/UserSections/LicensesAndcertifications/LicensesAndcertifications.routes.js";
import NotificationRouter from "./src/modules/Notifications/Notifications.routes.js";
import ChatRouter from "./src/modules/ChatSystem/Chat.routes.js";
import PaymentRouter from "./src/modules/Payment/Payment.routes.js";
import CompanyRouter from "./src/modules/Companys/Company/Company.routes.js";






export const app = express()
const port = process.env.port || 3000





app.use(express.json());

app.use(cors({origin : "*"}));








//TODO================MainRouters===============================>


app.use("/api/v1/Company", CompanyRouter); //*==Companies=>

app.use("/api/v1/user", UserRouter); //*==User=>

app.use("/api/v1/payment/webhook", PaymentRouter);//*==Payment=>

app.use("/api/v1/user/Chat", ChatRouter);//*==Chat=>

app.use("/api/v1/user/Notifications", NotificationRouter);//*====Notifications=>



//!=================UserSections==========================>

  
app.use("/api/v1/AboutUser", AboutSectionRouter); 

app.use("/api/v1/UserExperiences", ExperienceSectionRouter);

app.use("/api/v1/UserEducation", EducationSectionRouter); 

app.use("/api/v1/UserLanguages", LanguageSectionRouter); 

app.use("/api/v1/UserCourse", CourseSectionRouter); 

app.use("/api/v1/UserProjects", ProjectSectionRouter); 

app.use("/api/v1/UserLicenses", LicensesAndcertificationsRouter); 


// !===========================>



app.use('/', (req, res) => res.send('WellCome at YCG Api'))

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error"});
});

connectionDB()

app.listen(port, () => console.log(`successfully connected`))

