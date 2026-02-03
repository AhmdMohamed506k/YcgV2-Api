import express  from 'express';
import connectionDB from './DB/contectionDB.js';
import connectRedis from "./src/utils/redisClient/redisClient.js"; 
import cors from 'cors';
import userRouter from "./src/modules/users/user.routes.js"
import PostRouter from "./src/modules/posts/post.routes.js"
import ExperienceSectionRouter from './src/modules/sections/ExperienceSection/ExperienceSection.routes.js';
import AboutSectionRouter from './src/modules/sections/AboutSection/AboutSection.routes.js';
import EducationSectionRouter from './src/modules/sections/EducationSection/EducationSection.routes.js';
import LanguageSectionRouter from './src/modules/sections/LanguagesSection/LanguagesSection.router.js';
import CourseSectionRouter from './src/modules/sections/CoursesSection/CourseSection.routes.js';
import ProjectSectionRouter from './src/modules/sections/ProjectSection/ProjectSection.routes.js';
import 'dotenv/config'
import LicensesAndcertificationsRouter from './src/modules/sections/LicensesAndcertifications/LicensesAndcertifications.routes.js';

export const app = express()
const port = process.env.port || 3000





app.use(express.json());
app.use(cors({origin : "*"}));




app.use("/api/v1/user", userRouter); 
app.use("/api/v1/AboutUser", AboutSectionRouter); 
app.use("/api/v1/UserExperiences", ExperienceSectionRouter);
app.use("/api/v1/UserEducation", EducationSectionRouter); 
app.use("/api/v1/UserLanguages", LanguageSectionRouter); 
app.use("/api/v1/UserCourse", CourseSectionRouter); 
app.use("/api/v1/UserProjects", ProjectSectionRouter); 
app.use("/api/v1/UserLicenses", LicensesAndcertificationsRouter); 
app.use("/", PostRouter); 





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

