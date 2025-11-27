

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";


//fake data
const users = [
    { id: 1, name: "Abdul" },
    { id: 2, name: "John" },
    { id: 3, name: "Sarah" },
  ];

  const posts = [
    { id: 1, userId: 1, title: "GraphQL 101", content: "Learning GraphQL step by step" },
    { id: 2, userId: 1, title: "Node.js Tips", content: "Event loop explained" },
    { id: 3, userId: 2, title: "React Basics", content: "Hooks and components" },
  ];

  
//Schema
const typeDefs = `#graphql
type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

type Post {
  id: ID!,
  title: String!,
  content: String!
}

type Mutation {
  createUser(name: String!): User!
}

type Query {
    hello: String!
    user(id: ID!): User
    users: [User!]!
}
`

//Resolvers
const resolvers = {
    Query: {
        hello: () => 'Hello, Lanre',

        users: () => users,

        user: (parent, args) => {
            return users.find(u => u.id == args.id)
        }
    },

    User: {
        posts: (parent) => {
            return posts.filter(p => p.userId == parent.id)
        }
    },

    Mutation: {
        createUser: (parent, args, ctx) => {
            const newUser = {
                id: ctx.users.length + 1,
                name: args.name,
            }

            ctx.users.push(newUser)
            return newUser
        }
    }
}

//Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers
})

//Start the server
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => {
        return {
            users,
            posts
        }
    }
})

console.log('GraphQL server is running at: ' + url)