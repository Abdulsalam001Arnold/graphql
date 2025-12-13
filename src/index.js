import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cacheRoutes from "./routes/cacheRoutes.js";
import dotenv from "dotenv";
import {userLoader} from "./loaders/userLoader.js";
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
app.use('/api/cache', cacheRoutes);
app.use(cookieParser());
app.use(bodyParser.json());

const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
        if(process.env.NODE_ENV === 'production' && formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'){
    return{
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
    }
        }

        return formattedError;
    }
});
await server.start();


app.use('/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => {
        const token = req.cookies?.token;
        let currentUser = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUser = await userModel.findById(decoded.id).select('-password');
            } catch (err) {
                console.error("Invalid token:", err.message, err.code);
            }
        }
        return {
            models: { userModel, postModel, commentModel },
            currentUser,
            req,
            res,
            userLoader
        };
    }
}));

app.listen(4000, () => console.log("Server running at http://localhost:4000/graphql"));
