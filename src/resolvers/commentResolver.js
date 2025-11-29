

const comments = [
    { id: "1", text: "Great post!", userId: "1", postId: "1" },
    { id: "2", text: "Very helpful!", userId: "2", postId: "1" },
];


export const commentResolvers = {
    Query: {
        comments: () => comments,
        comment: (_, {id}) => comments.find(comment => comment.id === id)
    },

    Mutation: {
        createComment: (_, {input}) => {
            const newComment = {
                id: String(comments.length + 1),
                text: input.text,
                userId: input.userId,
                postId: input.postId
            }

            comments.push(newComment)
            return newComment
        }
    }


}