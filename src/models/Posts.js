

import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
       ref: "User"
    }
}, {timestamps: true})


export const postModel = mongoose.model("Post", postSchema)