

export const userResolvers = {
    Query: {
        users: () => [],
        user: (_, {id}) => {
            return
        }
    },

    Mutation: {
        createUser: (parent, args, ctx) => {
            const {name, email, password} = args.input

            const newUser = {
                name, email, password
            }

            return newUser
        },
    }
}