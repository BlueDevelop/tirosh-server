const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const errorHandler = require("errorhandler");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

// Connection URL
const url = "mongodb://localhost:27017";
// Database Name
const dbName = "icu-dev";

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === "production";

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "passport-tutorial",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

if (!isProduction) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect("mongodb://localhost/tirosh");

//mongoose.set('debug', true);

//Models & routes
require("./models/Users");
require("./models/Updates");
require("./models/Events");
require("./config/passport");
app.use(require("./routes"));

app.get("/api/tasks", (req, res) => {
  const client = new MongoClient(url);
  client.connect(function(err) {
    assert.equal(null, err);
    const db = client.db(dbName);
    const collection = db.collection("projects");
    const aggregation_array = [
      { $match: {} },
      {
        $lookup: {
          from: "users",
          localField: "assign",
          foreignField: "_id",
          as: "assign"
        }
      },
      { $unwind: "$assign" },
      {
        $project: {
          title: 1,
          description: 1,
          due: 1,
          assign: { $concat: ["$assign.name", "  ", "$assign.id"] }
        }
      }
    ];
    collection.aggregate(aggregation_array).toArray(function(err, docs) {
      assert.equal(err, null);

      return res.json({ tasks: docs });
    });
  });
});
//Static file declaration
app.use(express.static(path.join(__dirname, "client/build")));

//build mode
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

//Error handlers & middlewares
if (!isProduction) {
  app.use((err, req, res) => {
    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

app.listen(8000, () => console.log("Server running on http://localhost:8000/"));
