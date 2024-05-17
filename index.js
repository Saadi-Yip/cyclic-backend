const express = require("express");
require("./db");
const app = express();
const path = require("path");
const cors = require("cors");
const { specs } = require("./config.js");
const swaggerUI = require("swagger-ui-express");
const routes = require('./routes/routes');
const solitaryRoutes = require('./routes/solitary');
const errorHandler = require("./controllers/errorController");
const PORT = process.env.PORT || 5000;
app.set("view engine", "ejs");

/************** Middlewares ****************/
app.use(express.static(path.resolve('./public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	next();
});
let corsOptions = {
    origin: '*',
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
app.use(cors(corsOptions));

app.use (errorHandler);

/************** Routes ****************/
app.use('/' ,routes); /*** Application Route ***/
app.use('/solitary' ,solitaryRoutes); /*** Application Route ***/
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs)); /*** Documentation Route ***/

/*** Listen to Port ***/
app.listen(PORT);
module.exports = app;


