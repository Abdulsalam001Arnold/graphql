
import bcrypt from 'bcryptjs'
import {generateToken} from "../utils/token.js";
import {protect} from "../middleware/protect.js";
export const userResolvers = {
    Query: {
        users: async (_, __, {models}) => {
           const users = await models.userModel.find()
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
                if(existingUser) throw new Error('User already exists')
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
                throw new Error('Please provide all required fields')
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
                    if(!user) throw new Error('User does not exist, please register')
                    const comparedPassword = await bcrypt.compare(password, user.password)
                    if(!comparedPassword) throw new Error('Invalid credentials')
                    const token = await generateToken(user)
                    res.cookie('token', token,
                        {
                            httpOnly: true,
                            secure: process.env.NODE_ENV !== 'development',
                            sameSite: 'strict',
                            maxAge: 1000 * 60 * 60 * 24 * 1 //1 day
                        })
                    return {user}
                }else{
                    throw new Error('Please provide all required fields')
                }
            }catch(err){
                if(err instanceof Error) throw new Error()
            }
        },

        updateUser: async(_, {input}, {models, currentUser}) => {

            const { name, email, password, id } = input;
            protect(currentUser)
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