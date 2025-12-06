
import gql from 'graphql-tag';

export const postSchema = gql`
    scalar Date
    
type Post {
id: ID!
    title: String!
    content: String!
    author: User!
    comments(limit: Int, page: Int, sortBy: String, newest: Boolean): [Comment!]!
    createdAt: Date!
}

input CreatePostInput {
title: String!
content: String!
    userId: ID!
}

extend type Query {
posts(page: Int, limit: Int, sortBy: String, newest: Boolean, userId: ID): [Post!]!
post(id: ID!): Post!
}

extend type Mutation {
createPost(input: CreatePostInput!): Post!
}
`