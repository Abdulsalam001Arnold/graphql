import {userResolvers} from "./userResolvers.js";
import {postResolvers} from "./postResolvers.js";
import {commentResolvers} from "./commentResolver.js";
import {mergeResolvers} from '@graphql-tools/merge'

export const resolvers = mergeResolvers([userResolvers, postResolvers, commentResolvers])