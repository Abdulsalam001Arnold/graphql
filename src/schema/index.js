

import {userSchema} from "./user.js";
import { mergeTypeDefs } from "@graphql-tools/merge";
import {postSchema} from "./post.js";
import {commentSchema} from "./comment.js";

export const typeDefs = mergeTypeDefs([userSchema, postSchema, commentSchema])