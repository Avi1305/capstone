import { Router } from "express";
import { createPod } from "../kubernetes/pod.js";
import { createService } from "../kubernetes/service.js";
import { createSandBoxKey } from "../config/redis.js";
import { v7 as uuid } from "uuid";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import Project from "../models/project.model.js";

const router = Router();

router.post("/project", authMiddleware, async (req, res) => {
  const { title } = req.body;

  const newProject = new Project({
    user: req.user.id,
    title,
  });

  await newProject.save();

  return res.status(201).json({
    message: "Project created successfully",
    project: newProject,
  });
});

router.post("/start", authMiddleware, async (req, res) => {
  const projectId = req.body.projectId;

  const project = await Project.findOne({
    _id: projectId,
    user: req.user.id,
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const sandBoxId = uuid();

  await Promise.all([
    createPod(sandBoxId, projectId),
    createService(sandBoxId),
    createSandBoxKey(sandBoxId),
  ]);

  return res.status(200).json({
    message: "Sandbox started",
    sandboxId: sandBoxId,
    previewUrl: `http://${sandBoxId}.preview.localhost`,
  });
});

router.get("/project", authMiddleware, async (req, res) => {
  const projects = await Project.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  return res.status(200).json({
    message: "Projects fetched successfully",
    projects,
  });
});

export default router;
