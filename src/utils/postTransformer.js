

export const postTransformer = (post) => {
    if(!post) return null

    const plainPost = post.toObject ? post.toObject() : post

    return {
        ...plainPost,
        id: plainPost._id?.toString() || plainPost.id,
        _id: undefined
    }
}

export const postsTransformer = (posts) => {
    if(!posts) return []
    if(!Array.isArray(posts)) return []
    return posts.map(postTransformer)
}