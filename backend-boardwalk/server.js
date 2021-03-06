const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoSessionStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");

//some fun packages that help us with useful stuff
//helmet provides extra security...
const helmet = require("helmet");

//and morgan lets us have verbose logs 
const morgan = require("morgan");

//require environment variables and immediately configure them
require("dotenv").config();

//require our specific configuration of passport
const passport = require("./config/passport");

//connect to the Mongo DB
mongoose.connect(
  process.env.MONGODB_URI ||  'mongodb://localhost/boardwalk2020', // MONGODB_URI is stored in heroku already See note
  // to see heroku activities git heroku --tail
  // to see the repos version git remote -v
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
);

//set up our port and begin an express app
const PORT = process.env.PORT || 3001;
const app = express();

// Security zone!
// Ensure we only access the application via https in production:
if (process.env.NODE_ENV === "production") {
  app.use(helmet.hsts());
}

// Logs time...as long as we're not in production
if (process.env.NODE_ENV !== "production") {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

//Set up our session
const sessionConfig = {
  store: new MongoSessionStore({ mongooseConnection: mongoose.connection }), //this line says we're going to use the connection to the db we already have
  secret: process.env.COOKIE_SECRET, // secret can be any key you want. store in .env
  resave: false,
  saveUninitialized: true,
  cookie: {},
  name: "id" //make session cookie name generic so it's harder to tell what tech we are using
};

//In production, ensure we are using secure cookies for our session!
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionConfig.cookie.secure = true;  // serve secure cookies
  sessionConfig.cookie.httpOnly = true; // ensure front end js cannot touch cookie 
}

app.use(session(sessionConfig));

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Initialize passport 
app.use(passport.initialize());
app.use(passport.session());

//--------------comment this because we don't have client section for this backend section-------------
// // Serve up static assets (usually on heroku)
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
// }
//----------------------------------------------------------------------

// Define API routes here
const routes = require("./routes");
app.use(routes);

// Default behavior: send every unmatched route request to the React app (in production)
app.get("*", (req, res) => {

  //------comment out for no client section------------------------
  // if (process.env.NODE_ENV === "production") {
  //   return res.sendFile(path.join(__dirname, "./client/build/index.html"));
  // }
  //----------------------------------------------------------------

  res.status(404).send("This route does not exist!");
});

app.listen(PORT, () => {
  console.log(`🌎 ==> API server now on port ${PORT}!`);
});