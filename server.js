const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const router = require("./routes/userRoute");
const { errorHandler } = require("./middleWare/errorHandler");
const cookieParser = require('cookie-parser');

const app = express();

const PORT = process.env.PORT || 5000;


// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());


// Routes Middleware
app.use("/api/users", router)

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "server running on localhost master"
    })
});

// Error Middleware
app.use(errorHandler);

// Connect to DB and start server
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Database connected");
    
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})
}).catch((err) => {
    console.log(err);
} )
