
import DataLoader from 'dataloader';
import {userModel} from "../models/User.js";


export const userLoader = new DataLoader(async (ids) => {
    const users = await userModel.find({_id: {$in: ids}})
    const userMap = {}

    users.forEach(u => (userMap[u._id] = u))

    return ids.map(id => userMap[id])
})