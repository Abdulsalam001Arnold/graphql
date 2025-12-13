

import gql from 'graphql-tag';

export const commentSchema = gql`
    type Comment{
    id: ID!
    text: String!
        author: User!
        post: Post!
        userId: ID!
        postId: ID!
        createdAt: Date!
        updatedAt: Date!
    }
    
    input CreateCommentInput{
    text: String!
    postId: ID!
        userId: ID!
    }
    
    input UpdateCommentInput{
    id: ID!
    text: String!
    }
    
    extend type Query {
    comments(page: Int, limit: Int, sortBy: String, newest: Boolean, postId: ID): [Comment!]!
    comment(id: ID!): Comment!
    }
    
    extend type Mutation {
    createComment(input: CreateCommentInput!): Comment!
        updateComment(input: UpdateCommentInput!): Comment!
        deleteComment(id: ID!): Comment!
    }
`