
const posts = [
    { id: "1", title: "GraphQL 101", content: "Learning GraphQL", userId: "1" },
    { id: "2", title: "Node.js Tips", content: "Understanding event loop", userId: "1" },
];

export const postResolvers = {
    Query: {
        posts: () => posts,
        post: (_, {id}) => posts.find(post => post.id === id)
    },

    Mutation: {
        createPost: (_, { input }) => {
            const newPost = {
                id: String(posts.length + 1),
                title: input.title,
                content: input.content,
                userId: input.userId
            }

            posts.push(newPost)
            return newPost
        }
    },

    // Post: {
    //     author: (parent, _, ctx) => {
    //         return ctx.users
    //     }
    // }
}