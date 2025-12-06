import { AppError } from "../utils/error.js";

export const postResolvers = {
    Query: {
        posts: async (_, { page = 1, limit = 10, sortBy = 'createdAt', newest = true, userId }, { models }) => {
            try {
                const skip = (page - 1) * limit;
                const sortOrder = newest ? -1 : 1;

                // Build filter object
                const filter = userId ? { userId } : {};

                // Validate sortBy field
                const validSortFields = ['createdAt', 'title', 'id'];
                const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

                const posts = await models.postModel
                    .find(filter)
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(limit);

                return posts;
            } catch (error) {
                throw new AppError('Failed to fetch posts', 500);
            }
        },

        post: async (_, { id }, { models }) => {
            try {
                const post = await models.postModel.findById(id);

                if (!post) {
                    throw new AppError('Post not found', 404);
                }

                return post;
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

                return post;
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError('Failed to create post', 500);
            }
        }
    },

    Post: {
        // Resolve the author field - this is the key resolver for the relationship
        author: async (parent, _, { models }) => {
            try {
                // parent.userId contains the user ID from the post document
                const author = await models.userModel.findById(parent.userId);

                if (!author) {
                    throw new AppError('Author not found', 404);
                }

                return author;
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError('Failed to fetch author', 500);
            }
        },

        comments: async (parent, { limit = 10, page = 1, sortBy = 'createdAt', newest = true }, { models }) => {
            try {
                const skip = (page - 1) * limit;
                const sortOrder = newest ? -1 : 1;

                // Validate sortBy field
                const validSortFields = ['createdAt', 'id'];
                const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

                const comments = await models.commentModel
                    .find({ postId: parent.id })
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(limit);

                return comments;
            } catch (error) {
                throw new AppError('Failed to fetch comments', 500);
            }
        }
    }
};