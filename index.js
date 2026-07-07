
import 'dotenv/config'
import express from "express";
import connectionDB from "./DB/connectionDB.js";
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
import ActivityRouter from './src/modules/Activities/Activity.routes.js';
import FeaturesRouter from './src/modules/WebsiteFeatures/Features.routes.js';
import JobRouter from './src/modules/Jobs/Jobs.routes.js';
import ApplicationRouter from './src/modules/Application/Application.routes.js';
import LiveStreamChatRouter from './src/modules/LiveStreamChat/LiveStreamChat.routes.js';
import * as PY from "./src/modules/Payment/Payment.controller.js";
import LiveServer from "./src/service/LiveStream/LiveServer.js";





export const app = express()
const port = process.env.port || 3000



//=========CorsOrigin=======>
app.use(cors({origin : "*"}));
//==ExpressJson==>
app.use(express.json());




//================Payment===============================>
app.post("/api/v1/payment/webhook", express.raw({ type: 'application/json' }), PY.GlobalWebHook);















//RED1================MainRouters===============================>

app.use("/api/v1/user/Notifications", NotificationRouter);

app.use("/api/v1/LiveStream", LiveStreamChatRouter);

app.use("/api/v1/applications", ApplicationRouter);

app.use("/api/v1/Activities", ActivityRouter);

app.use("/api/v1/Features", FeaturesRouter);

app.use("/api/v1/Company", CompanyRouter); 

app.use("/api/v1/payment", PaymentRouter);

app.use("/api/v1/user/Chat", ChatRouter);

app.use("/api/v1/user", UserRouter); 

app.use("/api/v1/Jobs", JobRouter); 







//YELLOW1=================UserSections==========================>
app.use("/api/v1/UserSections/UserLicenses", LicensesAndcertificationsRouter); 

app.use("/api/v1/UserSections/UserProjects", ProjectSectionRouter); 

app.use("/api/v1/UserSections/UserLanguage", LanguageSectionRouter); 

app.use("/api/v1/UserSections/UserExperience", ExperienceSectionRouter);

app.use("/api/v1/UserSections/EducationSection", EducationSectionRouter);

app.use("/api/v1/UserSections/CourseSection", CourseSectionRouter); 

app.use("/api/v1/UserSections/AboutSection", AboutSectionRouter); 






//=========================================LiveStream====================================================>
LiveServer();




//===========================>
app.use('/', (req, res) => res.send('WellCome at YCG Api'))

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error"});
});

connectionDB()

app.listen(port, () => console.log(`successfully connected`))

