

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import {typeDefs} from "./schema/index.js";
import {resolvers} from "./resolvers/index.js";
import {connectDB} from "./db/connect.js";
import dotenv from "dotenv";
dotenv.config();


await connectDB()
//Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers
})

const startServer = async () => {
    const {url} = await startStandaloneServer(server, {
        listen: {port: 4000},
        context: async () => ({
            models: {
                User,
                Comment,
                Post
            }
        })
    })

    console.log(`Server running at ${url}`);
}

startServer()

