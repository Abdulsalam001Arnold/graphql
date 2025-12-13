
import { AppError } from "../utils/error.js";
import {cacheService} from "../services/cachedService.js";
import {GraphQLError} from "graphql";
import {postsTransformer, postTransformer} from "../utils/postTransformer.js";
import {commentsTransformer} from "../utils/commentTransformer.js";

export const postResolvers = {
    Query: {
        posts: async (_, { page = 1, limit = 10, sortBy = 'createdAt', newest = true, userId }, { models }) => {
            try {
                const cachedKey = await cacheService.generateKey('posts:list', `${page}-${limit}-${sortBy}-${newest}-${userId || 'all'}`);

                const cachedData = await cacheService.get(cachedKey)
                if(cachedData) {
                    console.log('Cache HIT:', postsTransformer(cachedData))
                    return postsTransformer(cachedData)
                }

                console.log('Cache MISS: hitting the server now!', cachedKey)
                const skip = (page - 1) * limit;
                const sortOrder = newest ? -1 : 1;


                const filter = userId ? { userId } : {};

                // Validate sortBy field
                const validSortFields = ['createdAt', 'title', 'id'];
                const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

                const posts = await models.postModel
                    .find(filter)
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                const transformedPosts = postsTransformer(posts)
                    await cacheService.set(cachedKey, transformedPosts, cacheService.TTL.MEDIUM)
                return transformedPosts;
            } catch (error) {
                throw new AppError('Failed to fetch posts', 500);
            }
        },

        post: async (_, { id }, { models }) => {
            try {
                const cachedKey = await cacheService.generateKey('post', id);
                const cachedData = await cacheService.get(cachedKey)

                if(cachedData) {
                    console.log('Cache HIT:', postTransformer(cachedData))
                    return postTransformer(cachedData)
                }

                const post = await models.postModel.findById(id);

                if (!post && !cachedData) {
                    throw new AppError('Post not found', 404);
                }

                const transformedPost = postTransformer(post)
                await cacheService.set(cachedKey, transformedPost);
                return transformedPost;
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError('Failed to fetch post', 500);
            }
        }
    },

    Mutation: {
        createPost: async (_, { input }, { models, currentUser }) => {
            const { title, content, userId } = input;

            // Validate required fields
            if (!title || !content || !userId) {
                throw new AppError('Please provide all required fields', 400);
            }

            // Check authorization
            if (!currentUser) {
                throw new AppError('Not authorized', 401);
            }

            // Verify user can only create posts for themselves (optional security check)
            if (currentUser.id !== userId) {
                throw new AppError('You can only create posts for yourself', 403);
            }

            try {
                // Verify user exists
                const userExists = await models.userModel.findById(userId);
                if (!userExists) {
                    throw new AppError('User not found', 404);
                }

                const post = await models.postModel.create({
                    title,
                    content,
                    userId,
                    createdAt: new Date()
                });

                await cacheService.deletePattern('posts:list:*');
                await cacheService.deletePattern(`posts:user:${userId}:*`)

                return postTransformer(post.toObject());
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError('Failed to create post', 500);
            }
        }
    },

    Post: {
        author: async (parent, _, { models,  userLoader}) => {
            try {
                const author = await userLoader.load(parent.userId.toString())

                if (!author) {
                    throw new AppError('Author not found', 404);
                }
                console.log('Author loaded from cache:', author)
                return author;
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError('Failed to fetch author', 500);
                throw new GraphQLError('INTERNAL_SERVER_ERROR', { extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { message: error.message, stack: error.stack } } });
            }
        },

        comments: async (parent, { limit = 10, page = 1, sortBy = 'createdAt', newest = true }, { models }) => {
            try {
                const cachedKey = await cacheService.generateKey(`comments:post:${parent.id}`, `${limit}-${page}-${sortBy}-${newest}`);

                const cachedData = await cacheService.get(cachedKey)

                if(cachedData) {
                    console.log('Cache HIT:', cachedKey)
                    return commentsTransformer(cachedData)
                }

                console.log('Cache MISS:', cachedKey)

                const skip = (page - 1) * limit;
                const sortOrder = newest ? -1 : 1;

                // Validate sortBy field
                const validSortFields = ['createdAt', 'id'];
                const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

                const comments = await models.commentModel
                    .find({ postId: parent.id })
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    const transformedComments = commentsTransformer(comments)
                await cacheService.set(cachedKey, transformedComments, cacheService.TTL.SHORT)

                return transformedComments;
            } catch (error) {
                throw new AppError('Failed to fetch comments', 500);
                throw new GraphQLError('INTERNAL_SERVER_ERROR', { extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { message: error.message, stack: error.stack } } });
            }
        }
    }
};