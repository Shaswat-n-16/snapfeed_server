import { Post, Comment, User } from "../db";
import logger from "../logger";
import { validationResult } from "express-validator";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import { error } from "winston";

cloudinary.config({
  cloud_name: "dh4h6vzi9",
  api_key: "953955791625995",
  api_secret: "HkthF16PhlS3nZafoONqJYOkRPQ",
});

export const getPosts = async (req, res) => {
  try {
    const { _page = 1, _limit = 20, _search } = req.query;
    // page size = 10
    if (_search && _search.length > 0) {
      const posts = await Post.find({
        title: { $regex: _search, $options: "i" },
      })
        // await Post.find({$text: {$search: _search}})
        .limit(_limit)
        .skip((_page - 1) * 10)
        .sort({ createdAt: -1 })
        .populate("user");
      return res.status(200).json({
        message: "Posts fetched successfully",
        success: true,
        data: posts,
      });
    }
    const offset = (_page - 1) * 10;
    const posts = await Post.find()
      .limit(_limit)
      .skip(offset)
      .sort({ createdAt: -1 })
      .populate("user");

    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      data: posts,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findOne({ _id: id });
    const comments = await Post.findOne({ _id: id }).populate(
      "comments",
      "commentText user userinitials userfullName"
    );
    const user = await User.findOne({ _id: post.user }).select(
      "firstName lastName "
    );
    const userObject = user.toObject({ virtuals: true });

    return res.status(200).json({
      message: "Post fetched successfully",
      success: true,
      data: {
        postData: post,
        user: {
          id: user._id,
          initials: user.initials,
          fullName: user.fullName,
        },
        comments: comments,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors);
      return res.status(400).json({
        message: errors.array(),
        success: false,
      });
    }

    const response = await cloudinary.uploader.upload(
      req.body.image,
      { folder: "Snapfeed", public_id: `${req.body.title}` },
      function (error, result) {
        return result;
      }
    );

    console.log("Image uploaded");
    const fileUrl = response.url;
    const { title, description } = req.body;
    const post = await Post.create({
      title,
      description,
      image: fileUrl,
      user: req.user.id,
    });

    return res.status(200).json({
      message: "Post created successfully",
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const deletePost = async (req, res) => {
  // only the owner should be able to delete a post or a moderator
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(500).json({
        message: "Post not found",
        success: false,
      });
    }
    const posttitle = post.title;
    await cloudinary.api
      .delete_resources([`${posttitle}`], {
        type: "upload",
        resource_type: "image",
      })
      .then(console.log);
    const commentIds = post.comments;
    await Comment.deleteMany({ _id: { $in: commentIds } });
    await Post.findByIdAndDelete(id);

    // console.log("Post to be deleted", post);
    return res.status(200).json({
      message: "Post Deleted successfully",
      success: true,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const editPost = async (req, res) => {
  // only the owner should be able to delete a post or a moderator
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id });
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    if (post.user._id.toString() !== req.user.id) {
      // if post doesn't belong to the user don't allow him/her to edit it
      return res.status(401).json({
        message: "You are not authorized to edit this post",
        success: false,
      });
    }
    const { title, description } = req.body;
    await Post.findByIdAndUpdate(id, {
      ...(title && { title }),
      ...(description && { description }),
    });
    return res.status(200).json({
      message: "Post created successfully",
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;
    const post = await Post.findOne({ _id: id });
    // console.log("from likepost", post);
    if (!post) {
      return res.status(404).json({
        message: "post not available",
        success: false,
        data: null,
      });
    }
    const isLiked = post.likedBy.includes(user);
    console.log(isLiked);
    if (!isLiked) {
      // Unlike
      post.like += 1;
      post.likedBy.push(user);
    }
    // } else {
    //   // Like
    //   post.like++;
    //   post.likedBy.push(user);
    // }
    // console.log(post);
    const updatedPost = await post.save();
    console.log(updatedPost);
    return res.status(200).json({
      message: "Updated like count",
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;
    const post = await Post.findOne({ _id: id });
    // console.log("from likepost", post);
    if (!post) {
      return res.status(404).json({
        message: "post not available",
        success: false,
        data: null,
      });
    }
    const isLiked = post.likedBy.includes(user);
    console.log(isLiked);
    if (isLiked) {
      // Unlike
      post.like -= 1;
      post.likedBy.pull(user);
    }
    // } else {
    //   // Like
    //   post.like++;
    //   post.likedBy.push(user);
    // }
    // console.log(post);
    const updatedPost = await post.save();
    console.log(updatedPost);

    return res.status(200).json({
      message: "Updated like count",
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const checkLike = async (req, res) => {
  try {
    const { id, userId } = req.params;
    // const { user } = req.body;
    const post = await Post.findOne({ _id: id });
    // console.log("from likepost", post);
    if (!post) {
      return res.status(404).json({
        message: "post not available",
        success: false,
        data: null,
      });
    }
    const isLiked = post.likedBy.includes(userId);
    console.log("isliked", isLiked);
    // if (!isLiked) {
    //   // Unlike
    //   post.like += 1;
    //   post.likedBy.push(user);
    // }
    // } else {
    //   // Like
    //   post.like++;
    //   post.likedBy.push(user);
    // }
    // console.log(post);
    // const updatedPost = await post.save();

    return res.status(200).json({
      message: "Liked",
      success: isLiked,
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
