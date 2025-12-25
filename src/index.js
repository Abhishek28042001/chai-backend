import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: './.env' })

connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log("error on connecting to db", err);

    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Server is running on PORT", process.env.PORT);

    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!", err);
    throw err;
})

















/*
import express from 'express';
const app = express();
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}}`)
        app.on("error", (err)=>{
            console.error('Failed to connect to the database:', err);
            throw err;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is running on port ${process.env.PORT}`);
        })
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
})()

*/