

export const commentTransformer = (comment) => {
    if(!comment) return null

    const plainComment = comment.toObject ? comment.toObject() : comment

    return {
        ...plainComment,
        id: plainComment._id?.toString() || plainComment.id,
        _id: undefined
    }
}


export const commentsTransformer = (comments) => {
    if(!comments) return []
    if(!Array.isArray(comments)) return []
    return comments.map(commentTransformer)
}