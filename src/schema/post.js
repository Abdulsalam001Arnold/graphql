
import gql from 'graphql-tag';

export const postSchema = gql`
type Post {
id: ID!
    title: String!
    content: String!
    author: User!
    userId: ID!
    comments(limit: Int, page: Int, sortBy: String, newest: Boolean): [Comment!]!
    createdAt: Date!
    updatedAt: Date!
}

input CreatePostInput {
title: String!
content: String!
    userId: ID!
}

input UpdatePostInput {
id: ID!
    title: String!
    content: String!
}

input DeletePostInput {
id: ID!
}
extend type Query {
posts(page: Int, limit: Int, sortBy: String, newest: Boolean, userId: ID): [Post!]!
post(id: ID!): Post
}

extend type Mutation {
createPost(input: CreatePostInput!): Post!
    updatePost(input: UpdatePostInput!): Post!
    deletePost(input: DeletePostInput!): Post!
}
`