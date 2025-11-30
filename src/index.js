import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { connectDB } from "./db/connect.js";
import { userModel } from "./models/User.js";
import { postModel } from "./models/Posts.js";
import { commentModel } from "./models/Comment.js";

dotenv.config();
await connectDB();

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();


app.use('/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => {
        const token = req.cookies?.token;
        let currentUser = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUser = await userModel.findById(decoded.id);
            } catch (err) {
                console.log("Invalid token:", err.message);
            }
        }
        return {
            models: { userModel, postModel, commentModel },
            currentUser,
            req,
            res
        };
    }
}));

app.listen(4000, () => console.log("Server running at http://localhost:4000/graphql"));
