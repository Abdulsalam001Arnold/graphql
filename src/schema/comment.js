

import gql from 'graphql-tag';

export const commentSchema = gql`
    type Comment{
    id: ID!
    text: String!
        author: User!
        post: Post!
        createdAt: Date!
    }
    
    input CreateCommentInput{
    text: String!
    postId: ID!
        userId: ID!
    }
    
    extend type Query {
    comments(page: Int, limit: Int, sortBy: String, newest: Boolean, postId: ID): [Comment!]!
    comment(id: ID!): Comment!
    }
    
    extend type Mutation {
    createComment(input: CreateCommentInput!): Comment!
    }
`