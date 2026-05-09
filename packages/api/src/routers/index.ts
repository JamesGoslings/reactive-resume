import { aiRouter } from "./ai";
import { authRouter } from "./auth";
import { flagsRouter } from "./flags";
import { resumeRouter } from "./resume";
import { resumeGroupRouter } from "./resume-group";
import { statisticsRouter } from "./statistics";
import { storageRouter } from "./storage";

export default {
	ai: aiRouter,
	auth: authRouter,
	flags: flagsRouter,
	resume: resumeRouter,
	resumeGroup: resumeGroupRouter,
	statistics: statisticsRouter,
	storage: storageRouter,
};
