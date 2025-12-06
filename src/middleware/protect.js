

export const protect = async (user) => {
    if(!user) throw new Error('Not authorized')
}