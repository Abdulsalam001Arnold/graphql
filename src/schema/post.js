
import gql from 'graphql-tag';

export const postSchema = gql`
type Post {
id: ID!
    title: String!
    content: String!
    author: User!
}

input CreatePostInput {
title: String!
content: String!
    userId: ID!
}

extend type Query {
posts: [Post!]!
post(id: ID!): Post!
}

extend type Mutation {
createPost(input: CreatePostInput!): Post!
}
`