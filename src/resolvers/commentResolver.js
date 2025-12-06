
import {protect} from "../middleware/protect.js";
import {AppError} from "../utils/error.js";


export const commentResolvers = {
    Query: {
        comments: async(_, {page = 1, limit = 10, sortBy = 'createdAt', newest = true}, {models, currentUser}) => {
            if(!currentUser) throw new AppError('Not authorized', 401)
            const  skip = (page - 1) * limit
            const sortOrder = newest ? -1 : 1
            const comments = await models.commentModel.find()
            return comments
        },
        comment: (_, {id}, {models, currentUser}) => {
            if(!currentUser) throw new AppError('Not authorized', 401)
            if(!id) throw new AppError('Comment id is required', 400)
            const comment = models.commentModel.findById(id)
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

                return comment
            }catch (err){
                if(err instanceof Error) throw new AppError(err.message, err.statusCode)
            }

        }
    }


}