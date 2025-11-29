

import gql from 'graphql-tag'

export const userSchema = gql`
 type User {
     id: ID!
 name: String!
     email: String!
     password: String!
 }
 
 input RegisterInput {
 name: String!
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
 users: [User!]!
     user(id: ID!): User
 }
 
 type Mutation {
 createUser(input: RegisterInput!): User
     updateUser(input: UpdateUserInput!): User!
     deleteUser(id: ID!): User!
 }
`