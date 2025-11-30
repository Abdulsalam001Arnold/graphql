

export const protect = (user) => {
    if(!user) throw new Error('Not authorized')
}