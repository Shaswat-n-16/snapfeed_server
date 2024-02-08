import logger from "../logger";
import { Post, Comment } from "../db";

export const comment = async (req, res) => {
  try {
    // added by middleware
    // console.log(req.body);
    // console.log(req.params);

    const userId = req.body.user;
    const { id } = req.params;
    const commentText = req.body.comment;
    const comment = await Comment.create({
      commentText,
      user: userId,
    });

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: comment._id,
        },
      },
      {
        new: true,
      }
    ).populate("comments", "commentText user");
    return res.status(200).json({
      message: "Comment posted successfully",
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const deleteComment = async (req, res) => {
  // done by moderator or owner
  try {
    const { postId, commentId } = req.params;
    await Comment.findByIdAndDelete(commentId);
    const updatedPost = await Post.findByIdAndUpdate(postId, {
      $pull: {
        comments: commentId,
      },
    });
    return res.status(200).json({
      message: "Comment deleted successfully",
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// export const commnetDetails = async (req, res) => {
//   const commentIds = req.paramas.commentIds.split(",");
//   try {
//     const comments = await Comment.find({
//       _id: { $in: commentIds },
//     });
//     return res.status(200).json({
//       message: "Comment details fetched successfully",
//       success: true,
//       data: comments,
//     });
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };
