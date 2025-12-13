

import gql from 'graphql-tag'

export const userSchema = gql`
    scalar Date
 type User {
     id: ID!
 name: String!
     email: String!
     password: String!
     posts(limit: Int, page: Int, sortBy: String, newest: Boolean): [Post!]!
     createdAt: Date!
     updatedAt: Date!
 }
 
 input RegisterInput {
 name: String!
 email: String!
     password: String!
 }
 
 input LoginInput {
 email: String!
     password: String!
 }
 
 input UpdateUserInput {
 id: ID!
     name: String
     email: String!
     password: String!
 }
 
 type Query {
 users(page: Int, limit: Int, sortBy: String, newest: Boolean, email: String): [User!]!
     user(id: ID!): User
     me: User
 }
 
 type AuthPayload {
 user: User!
 }
 
 type Mutation {
 createUser(input: RegisterInput!): AuthPayload!
     loginUser(input: LoginInput!): AuthPayload!
     updateUser(input: UpdateUserInput!): User!
     deleteUser(id: ID!): User!
 }
`