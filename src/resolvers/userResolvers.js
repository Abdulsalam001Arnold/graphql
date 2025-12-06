
import bcrypt from 'bcryptjs'
import {generateToken} from "../utils/token.js";
import {protect} from "../middleware/protect.js";
import {AppError} from "../utils/error.js";
import Redis from "ioredis";

    // const redis = new Redis();

export const userResolvers = {
    Query: {
        users: async (_, {limit = 10, page = 1, sortBy = "createdAt", newest = true, email}, {models}) => {
            console.log(email)
            const query = email ? {email} : {}
            const skip = (page - 1) * limit
           const users = await models.userModel.find(query).sort({
               [sortBy]: newest ? -1 : 1
           }).skip(skip).limit(limit)
            // const cachedUsers = await redis.get('users')
            // if(cachedUsers) return JSON.parse(cachedUsers)
            // await redis.setex('users', 60, JSON.stringify(users))
            return users
        },
        user: async (_, {id}, {models}) => {
            const user = await models.userModel.findById(id)
            if(!user) throw new Error('User not found')
            return user
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
                return {user}
            }else{
                throw new AppError('Please provide all required fields', 400)
            }
            }catch(err){
                if(err instanceof Error) throw new Error(err.message)
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
                    return {user}
                }else{
                    throw new AppError('Please provide all required fields', 400)
                }
            }catch(err){
                if(err instanceof Error) throw new AppError(err.message, err.code)
            }
        },

        updateUser: async(_, {input}, {models, currentUser}) => {

            const { name, email, password, id } = input;
            await protect(currentUser)
            const hashedPassword = await bcrypt.hash(password, 12)
            const updatedUser = await models.userModel.findByIdAndUpdate(id, {name, email, password: hashedPassword}, {new: true})

            return updatedUser
        },

        deleteUser: async (_, {id}, {models}) => {
            if(!id) throw new Error('User id is required')
            const deletedUser = await models.userModel.findByIdAndDelete(id)

            return deletedUser
        }
    }
}