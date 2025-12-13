

export const docTransformer = (doc) => {
    if(!doc) return null

    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
       ...plainDoc,
        id: plainDoc._id?.toString() || plainDoc.id,
        _id: undefined,
        password: undefined
    }
}

export const docsTransformer = (docs) => {
    if(!docs) return []
    if(!Array.isArray(docs)) return []
    return docs.map(docTransformer)
}