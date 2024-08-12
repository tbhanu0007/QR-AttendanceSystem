const express = require("express");
const path = require('path');
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const config = require("config");

const appController = require("./appController");
const isStudent = require("./middleware/is-student");
const isAdmin = require("./middleware/is-admin");

const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");

const app = express();
connectDB();

const store = new MongoDBStore({
  uri: mongoURI,
  collection: "mySessions",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(express.static(path.join(__dirname,'public')))

// Routes:

// Landing Page
app.get("/", appController.landing_page);

// Register Page
app.get("/register", appController.register_get);
app.post("/register", appController.register_post);

// Admin Panel:
app.post("/admin-panel",appController.adminLoginPost);
app.get("/admin-panel",isAdmin,appController.adminLoginGet);

// Generate QR code:
app.post("/qrcode",isAdmin,appController.qrCodePost);
app.post("/saveQR",appController.saveQR);

// VIEW RECORD:
app.get("/attendancerecord",isAdmin,appController.viewAttendance);


// STUDENT ACCOUNT DASHBOARD:
app.post("/studentDashboard",appController.student_post);
app.get("/studentDashboard",isStudent,appController.student_get)

// UPDATE ATTENDANCE RECORD:
app.post("/updating",isStudent,appController.update);

// LOGOUT:
app.post("/logout",appController.logOut);





app.listen(5000, console.log("App Running on http://localhost:5000"));
