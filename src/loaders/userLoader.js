
import DataLoader from 'dataloader';
import {userModel} from "../models/User.js";


export const userLoader = new DataLoader(async (ids) => {
    console.log(`Batch ${ids.length} of users loaded: ${ids}`)
    const users = await userModel.find({_id: {$in: ids}}).select('-password').lean()
    const userMap = {}

    users.forEach(u => (userMap[u._id] = u))

    return ids.map(id => {
        const user = userMap[id.toString()]
        if(!user) {
            return console.log(`User ${id} not found`)
        }

        return user || null
    })
})