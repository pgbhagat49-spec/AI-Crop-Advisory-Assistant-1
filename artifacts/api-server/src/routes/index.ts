import { Router, type IRouter } from "express";
import healthRouter from "./health";
import advisoriesRouter from "./advisories";
import dashboardRouter from "./dashboard";
import scansRouter from "./scans";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(advisoriesRouter);
router.use(scansRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
