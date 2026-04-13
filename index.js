
import 'dotenv/config'
import express  from 'express';
import connectionDB from './DB/contectionDB.js';
import cors from 'cors';
import userRouter from "./src/modules/users/User/user.routes.js"
import ExperienceSectionRouter from './src/modules/users/UserSections/ExperienceSection/ExperienceSection.routes.js';
import AboutSectionRouter from './src/modules/users/UserSections/AboutSection/AboutSection.routes.js';
import EducationSectionRouter from './src/modules/users/UserSections/EducationSection/EducationSection.routes.js';
import LanguageSectionRouter from './src/modules/users/UserSections/LanguagesSection/LanguagesSection.router.js';
import CourseSectionRouter from './src/modules/users/UserSections/CoursesSection/CourseSection.routes.js';
import ProjectSectionRouter from './src/modules/users/UserSections/ProjectSection/ProjectSection.routes.js';
import LicensesAndcertificationsRouter from './src/modules/users/UserSections/LicensesAndcertifications/LicensesAndcertifications.routes.js';
import ActivityRouter from './src/modules/users/UserSections/ActivitySection/ActivitySection.routes.js';
import NotificationRouter from './src/modules/users/Notifications/Notifications.routes.js';
import ChatRouter from './src/modules/users/ChatSystem/Chat.routes.js';
import PaymentRouter from './src/modules/users/Payment/Payment.routes.js';


export const app = express()
const port = process.env.port || 3000





app.use(express.json());
app.use(cors({origin : "*"}));



//==User=>
app.use("/api/v1/user", userRouter); 


//==Payment=>
app.use("/api/v1/payment/webhook", PaymentRouter);


//==CHAT=>
app.use("/api/v1/user/Chat", ChatRouter);


//====Notifications=>
app.use("/api/v1/user/Notifications", NotificationRouter);


//===SECTIONS=>
app.use("/api/v1/AboutUser", AboutSectionRouter); 
app.use("/api/v1/UserExperiences", ExperienceSectionRouter);
app.use("/api/v1/UserEducation", EducationSectionRouter); 
app.use("/api/v1/UserLanguages", LanguageSectionRouter); 
app.use("/api/v1/UserCourse", CourseSectionRouter); 
app.use("/api/v1/UserProjects", ProjectSectionRouter); 
app.use("/api/v1/UserLicenses", LicensesAndcertificationsRouter); 
app.use("/api/v1/UserActivity", ActivityRouter); 







app.use('/', (req, res) => res.send('Hello World hi!'))
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

connectionDB()

app.listen(port, () => console.log(`successfully connected`))

