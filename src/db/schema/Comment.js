import mongoose from "mongoose";
import { User } from "../schema/User";
// import { Console } from "winston/lib/winston/transports";
const CommentSchema = new mongoose.Schema(
  {
    commentText: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userinitials: {
      type: String,
      // required: true,
    },
    userfullName: {
      type: String,
      // required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);
CommentSchema.pre("save", async function (next) {
  console.log("Creating user initials");
  const user = await User.findOne(this.user);
  if (user) {
    this.userinitials = user.initials;
    // Access the virtual property
  }
  next();
});
CommentSchema.pre("save", async function (next) {
  console.log("Creating user fullanme");
  const user = await User.findOne(this.user);
  if (user) {
    this.userfullName = user.fullName;
    // Access the virtual property
  }
  next();
});

export const Comment = mongoose.model("Comment", CommentSchema);
