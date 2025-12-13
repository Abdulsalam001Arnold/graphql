
import {AppError} from "../utils/error.js";
import {GraphQLError} from "graphql";
import {cacheService} from "../services/cachedService.js";

export const commentResolvers = {
    Query: {
        comments: async(_, {page = 1, limit = 10, sortBy = 'createdAt', newest = true, postId}, {models, currentUser}) => {
            if(!currentUser) throw new AppError('Not authorized', 401)
            const cachedKey = await cacheService.generateKey('comments:list', `${page}-${limit}-${sortBy}-${newest}`)
            const cachedData = await cacheService.get(cachedKey)

            if(cachedData) {
                console.log('Cache HIT:', cachedKey)
                return cachedData
            }

            console.log('Cache MISS:', cachedKey)
            const filter = postId ? {postId} : {}
            const  skip = (page - 1) * limit
            const sortOrder = newest ? -1 : 1
            const comments = await models.commentModel.find(filter).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean()
            await cacheService.set(cachedKey, comments, cacheService.TTL.SHORT)
            return comments
        },
        comment: async(_, {id}, {models, currentUser}) => {
            if(!currentUser) throw new AppError('Not authorized', 401)
            if(!id) throw new AppError('Comment id is required', 400)
            const cachedkey = await cacheService.generateKey('comment', id)
            const cachedData = await cacheService.get(cachedkey)
            if(cachedData) {
                console.log('Cache HIT:', cachedkey)
                return cachedData
            }

            console.log('Cache MISS:', cachedkey)

            const comment = models.commentModel.findById(id)
            await cacheService.set(cachedkey, comment, cacheService.TTL.SHORT)
            return comment
        }
    },

    Mutation: {
        createComment: async(_, {input}, {models, currentUser}) => {
            const {text, postId, userId} = input

            try{
                if(!text || !postId || !userId) throw new AppError('Please provide all required fields', 400)

                if(!currentUser) throw new AppError('Not authorized', 401)

                if(currentUser.id !== userId) throw new AppError('You can only create comments for yourself', 403)

                const postExists = await models.postModel.findById(postId)
                if(!postExists) throw new AppError('Post not found', 404)

                const comment = await models.commentModel.create({
                    text, postId, userId
                })

                await cacheService.deletePattern('comments:list:*')
                await cacheService.deletePattern(`comments:post:${postId}:*`)

                return comment
            }catch (err){
                if(err instanceof Error) throw new AppError(err.message, err.statusCode)
                throw new GraphQLError('INTERNAL_SERVER_ERROR', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }

        }
    },

    Comment: {
        author: async(parent, _, {userLoader}) => {
            try{
                const author = await userLoader.load(parent.userId.toString())

                if(!author) throw new GraphQLError('Author not found', {extensions: {code: 'NOT_FOUND'}})

                return author
            }catch(err){
                if(err instanceof Error) throw new GraphQLError('INTERNAL_SERVER_ERROR', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }
        }
    },



}