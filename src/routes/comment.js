import express from "express";
import { comment, deleteComment, co } from "../controllers/comment";

const router = express.Router();

router.post("/:id", comment);
// router.get("/:id", commnetDetails);
router.delete("/:id", deleteComment);

export default router;
