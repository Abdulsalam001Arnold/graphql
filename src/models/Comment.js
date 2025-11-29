

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    text: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }
})


export const commentModel = mongoose.model("Comment", commentSchema)