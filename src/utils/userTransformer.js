

export const transformUser = (user) => {
    if(!user) return null
    const plainUser = user.toObject ? user.toObject() : user
    return {
       ...plainUser,
        id: plainUser._id?.toString() || plainUser.id,
        _id: undefined,
        password: undefined
    }
}

export const transformUsers = (users) => {
    if(!users) return null
    if(!Array.isArray(users)) return []
    return users.map(transformUser)
}