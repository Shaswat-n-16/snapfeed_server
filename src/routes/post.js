import { Router } from "express";
import {
  createPost,
  deletePost,
  editPost,
  getPost,
  getPosts,
  likePost,
  unlikePost,
  checkLike,
} from "../controllers/post";
import { body, query, param } from "express-validator";
import { User } from "../db";
import upload from "../utils/uploader";
import { isAuthenticated } from "../middlewares/auth";
const router = Router();

router.get("/", getPosts);
router.get("/:id", getPost);
// protected endpoint
router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  body("title").notEmpty().withMessage("Title is required"),
  createPost
);

// protected endpoint !only the owner should be able to delete a post or a moderator
router.patch("/:id", isAuthenticated, editPost);
router.post("/:id/like", likePost);
router.post("/:id/unlike", unlikePost);
router.get("/:id/is-liked/:userId", isAuthenticated, checkLike);

// protected endpoint !only the loggedinuser should be able to post a comment or a moderator
router.delete("/:id", isAuthenticated, deletePost);

export default router;
