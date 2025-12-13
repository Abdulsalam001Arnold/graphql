
import bcrypt from 'bcryptjs'
import {generateToken} from "../utils/token.js";
import {cacheService} from "../services/cachedService.js";
import {AppError} from "../utils/error.js";
import {GraphQLError} from "graphql";
import {transformUsers} from "../utils/userTransformer.js";
import {transformUser} from "../utils/userTransformer.js";

export const userResolvers = {
    Query: {
        users: async (_, {limit = 10, page = 1, sortBy = "createdAt", newest = true, email}, {models}) => {
            console.log(email)
            try{
                const cachedKey = await cacheService.generateKey('users:list', `${page}-${limit}-${sortBy}-${newest}-${email || 'all'}`);

                const cachedData = await cacheService.get(cachedKey);
                if(cachedData){
                    console.log(`Cache HIT: ${cachedKey}
                    data: ${cachedData}
                    `);
                    return transformUsers(cachedData);
                }

                console.log('Cache missed!, hitting the server now!', cachedKey)

            const query = email ? {email} : {}
            const skip = (page - 1) * limit
           const users = await models.userModel.find(query).select('-password').sort({
               [sortBy]: newest ? -1 : 1
           }).skip(skip).limit(limit).lean()
                const transformedUsers = transformUsers(users)
                await cacheService.set(cachedKey, transformedUsers, cacheService.TTL.MEDIUM )
            return transformedUsers
            }catch(err){
                throw new GraphQLError('Failed to fetch users', {
                    extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}
                })
            }
        },
        user: async (_, {id}, {models}) => {
            try{
                if(!id) throw new AppError('User id is required', 400)
                const cachedKey = await cacheService.generateKey('user', id);
                const cachedData = await cacheService.get(cachedKey);
                if(cachedData) {
                    console.log('Cache HIT: ' + cachedKey);
                    return transformUser(cachedData);
                }

                console.log('Cache missed!, hitting the server now!', id, cachedKey);

            const user = await models.userModel.findById(id).select('-password').lean()
                const transformedUser = transformUser(user)
            if(!transformedUser) throw new Error('User not found')
                transformedUser.password = undefined
                await cacheService.set(cachedKey, transformedUser, cacheService.TTL.LONG)
            return transformedUser
            }catch(err){
                throw new GraphQLError('Failed to fetch user', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }
        },
        me: async (_, __, {currentUser}) => {
            if(!currentUser) throw new AppError('Not authorized', 401)
            return currentUser
        }
    },

    Mutation: {
        createUser:  async(parent, {input}, {models, res}) => {
            const {name, email, password} = input
            try{
            if(email && name && password) {
                const existingUser = await models.userModel.findOne({email})
                if(existingUser) throw new AppError('User already exists', 400)
                const hashedPassword = await bcrypt.hash(password, 12)

           const user = await models.userModel.create({
               name,
               email,
               password: hashedPassword
           })
                const token = await generateToken(user)
                res.cookie('token', token, {httpOnly: true, secure: process.env.NODE_ENV !== "development", sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 1})
                user.password = undefined
                await cacheService.deletePattern('users:list:*');
                const transformedUser = {
                    ...user.toObject(),
                    id: user._id.toString(),
                    password: undefined
                }
                return {user: transformedUser}
            }else{
                throw new AppError('Please provide all required fields', 400)
            }
            }catch(err){
                if(err instanceof Error) throw new GraphQLError('Failed to create user', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }
        },

        loginUser: async(_, {input}, {models, res}) => {
            const {email, password} = input
            try{
                if(email && password) {
                    const user = await models.userModel.findOne({email})
                    if(!user) throw new AppError('User does not exist, please register', 404)
                    const comparedPassword = await bcrypt.compare(password, user.password)
                    if(!comparedPassword) throw new AppError('Invalid credentials', 400)
                    const token = await generateToken(user)
                    res.cookie('token', token,
                        {
                            httpOnly: true,
                            secure: process.env.NODE_ENV !== 'development',
                            sameSite: 'strict',
                            maxAge: 1000 * 60 * 60 * 24
                        })

                    const transformedUser = {
                        ...user.toObject(),
                        id: user._id?.toString(),
                        password: undefined
                    }
                    return {user: transformedUser}
                }else{
                    throw new AppError('Please provide all required fields', 400)
                }
            }catch(err){
                if(err instanceof Error) throw new AppError(err.message, err.code)
            }
        },

        updateUser: async(_, {input}, {models, currentUser}) => {
            const { name, email, password, id } = input;

            try{
                if(!currentUser) {
                    throw new GraphQLError('Not authorized', {extensions: {code: 'UNAUTHENTICATED'}})
                }

                if(currentUser.id !== id) {
                    throw new GraphQLError('Not authorized', {extensions: {code: 'FORBIDDEN'}})
                }

                let updatedData = {}

                if(name) updatedData.name = name
                if(email) updatedData.email = email
                if(password) updatedData.password = await bcrypt.hash(password, 12)

                const updatedUser = await models.userModel.findByIdAndUpdate(id, updatedData, {new: true}).select('-password')
                    if(!updatedUser) {
                        throw new GraphQLError('User not found', {extensions: {code: 'NOT_FOUND'}})
                    }
                await cacheService.invalidateUser(id);
                    return transformUser(updatedUser)
            }catch(err){
                throw new GraphQLError('Failed to update user', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }
        },

        deleteUser: async (_, {id}, {models, currentUser}) => {
            try{
                if(!id) throw new GraphQLError('User id is required', {extensions: {code: 'BAD_USER_INPUT'}})

                if(!currentUser) throw new GraphQLError('Not authorized', {extensions: {code: 'UNAUTHENTICATED'}})

                if(currentUser.id !== id) throw new GraphQLError('Not authorized', {extensions: {code: 'FORBIDDEN'}})

                const user = await models.userModel.findByIdAndDelete(id).select('-password').lean()
                if(!user) throw new GraphQLError('User not found', {extensions: {code: 'NOT_FOUND'}})
                await cacheService.invalidateUser(id);
                return transformUser(user)
            }catch (err){
                if(err instanceof Error) throw new GraphQLError('Failed to delete user', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
            }
        },

    },
        User: {
            posts: async(parent, {limit = 10, page = 1, sortBy = "createdAt", newest = true}, {models}) => {
                try{
                    const cachedKey = await cacheService.generateKey(`posts:user:${parent.id}`,
                        `${limit}-${page}-${sortBy}-${newest}`
                        )
                    const cachedData = await cacheService.get(cachedKey)

                    if(cachedData) {
                        console.log('Cache HIT', cachedData, cachedKey)
                        return cachedData
                    }
                const skip = (page - 1) * limit
                    const sortOrder = newest ? -1 : 1

                    const posts = await models.postModel.find({userId: parent.id}).sort({sortBy: sortOrder}).skip(skip).limit(limit).lean()
                    if(!posts) throw new GraphQLError('No posts found', {extensions: {code: 'NOT_FOUND'}})
                    const transformedPosts = posts.map(post => ({
                        ...post,
                        id: post._id?.toString(),
                        _id: undefined
                    }))
                    await cacheService.set(cachedKey, transformedPosts, cacheService.TTL.MEDIUM)

                    return transformedPosts
                }catch(err){
                    if(err instanceof Error) throw new GraphQLError('Failed to fetch posts', {extensions: {code: 'INTERNAL_SERVER_ERROR', exception: {message: err.message, stack: err.stack}}})
                }
            }
        }
}