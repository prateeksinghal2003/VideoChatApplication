import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";
//import { attachSocketHandlers } from "./controllers/socketManager.js";


const app = express();
const server = createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: [
//             "http://localhost:3000",
//             "https://videochatapplicationfrontend.onrender.com"
//         ],
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// });
// attachSocketHandlers(io);

const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
 const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://videochatapplicationfrontendpart2.onrender.com"
        // "https://videochatapplicationfrontend.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
 };
 app.use(cors(corsOptions));
 app.options(/.*/, cors(corsOptions));
 app.use(express.json({ limit: "40kb" })); //to limit the payload
 app.use(express.urlencoded({ limit: "40kb", extended: true }));


 
app.use("/api/v1/users", userRoutes);


const start = async () => {
    app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.MONGODB_URL)

    console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
    server.listen(app.get("port"), () => {
        console.log("LISTEN ON PORT 8000")
    });



}
start();


// import express from "express";
// Imports the Express framework (modern ES module style).

// express helps you build APIs and web servers quickly.

// js
// Copy code
// import { createServer } from "node:http";
// From Node.js’ built-in http module, you’re importing createServer.

// This allows you to create a raw HTTP server that Express will run on.

// Why? Because you need a lower-level server instance to attach Socket.IO to.

// js
// Copy code
// import { Server } from "socket.io";
// Imports the Server class from Socket.IO.

// Server will let you enable real-time communication (WebSockets) on your app.

// js
// Copy code
// import mongoose from "mongoose";
// Imports Mongoose, an ODM (Object Data Modeling) library.

// Used to interact with MongoDB (you define schemas and models instead of raw queries).

// js
// Copy code
// //import { connectToSocket } from "./controllers/socketManager.js";
// A commented line.

// Suggests at some point you had a separate file socketManager.js to organize socket logic, but not using it right now.

// js
// Copy code
// import cors from "cors";
// Imports CORS middleware (Cross-Origin Resource Sharing).

// Lets your backend server accept requests from a frontend running on a different domain/port (e.g., React frontend at localhost:3000).

// js
// Copy code
// //import userRoutes from "./routes/users.routes.js";
// Commented line.

// Probably meant for importing API routes for users, but not in use right now.

// js
// Copy code
// const app = express();
// Creates an Express application instance.

// This app object is what you’ll use to define routes, middlewares, etc.

// js
// Copy code
// const server = createServer(app);
// Creates an HTTP server and passes your app (Express app) into it.

// This wraps your Express app in a raw HTTP server, so both REST APIs (via Express) and WebSockets (via Socket.IO) can coexist.

// js
// Copy code
// const io = new Server(server);
// Creates a Socket.IO server instance and attaches it to your server.

// This lets clients connect over WebSockets.

// js
// Copy code
// app.set("port", (process.env.PORT || 8000))
// Sets a configuration variable (port) in the Express app.

// If process.env.PORT is defined (e.g., by hosting services like Heroku), it will use that; otherwise defaults to 8000.

// js
// Copy code
// app.use(cors());
// Applies the CORS middleware globally to your app.

// Ensures that frontend apps (React, Angular, etc.) can make API calls to your backend.

// js
// Copy code
// app.use(express.json({ limit: "40kb" })); 
// Middleware to parse JSON bodies of incoming requests.

// { limit: "40kb" } means request bodies larger than 40 KB will be rejected (helps prevent abuse, like huge payloads).

// js
// Copy code
// app.use(express.urlencoded({ limit: "40kb", extended: true }));
// Middleware to parse URL-encoded bodies (like form submissions).

// extended: true means it can parse nested objects (not just strings).

// Again, limited to 40 KB max.

// js
// Copy code
// const start = async () => {
// Declares an async function start to initialize DB connection and start the server.

// js
// Copy code
//     app.set("mongo_user")
// This line looks incomplete.

// Normally app.set("mongo_user", value) would set a config value.

// Here, no value is provided, so it doesn’t do anything useful. Might be leftover/debug code.

// js
// Copy code
//     const connectionDb = await mongoose.connect("mongodb+srv://prateeksinghal682_db_user:Kce0VGRx191PPF4F@cluster0.fekgnio.mongodb.net/")
// Connects to your MongoDB Atlas cluster using Mongoose.

// await ensures connection completes before moving forward.

// connectionDb holds the connection object.

// ⚠️ Note: Your MongoDB username & password are in plain text here – bad practice. Usually, they should be stored in .env files.

// js
// Copy code
//     console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
// Logs the host of the connected database to confirm successful connection.

// js
// Copy code
//     server.listen(app.get("port"), () => {
//         console.log("LISTEN ON PORT 8000")
//     });
// Starts the server, listening on the port stored in app.get("port").

// The callback logs that the server is running.

// ⚠️ The log always prints "LISTEN ON PORT 8000", but if you deploy with process.env.PORT, it could be a different port — so better to log app.get("port") dynamically.

// js
// Copy code
// }
// start();
// Closes the function and invokes start() so your server actually starts.

// ✅ Summary of Flow

// Import dependencies (Express, HTTP, Socket.IO, Mongoose, CORS).

// Create Express app and wrap it in an HTTP server.

// Attach Socket.IO to the server.

// Set middleware (CORS, JSON parsing, URL parsing).

// Connect to MongoDB.

// Start listening on port 8000 (or environment-defined port).