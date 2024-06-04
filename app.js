const path = require("path");
require("dotenv").config({
	debug:
		process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
			? true
			: true,
	path: path.resolve(__dirname, ".env"),
	override: true,
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();
const YAML = require("yamljs");
const multer = require("multer");

// Loggers
const morgan = require("morgan");
const logger = require("./config/winston");

// Global Middlewares
const swaggerDocument = YAML.load("./swagger.yaml");

app.use("/login/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));

app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:5173",
			"https://v2-stg-parkncharge.sysnetph.com",
		],
		methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH"],
	})
);
app.use(express.urlencoded({ extended: false })); // To parse the urlencoded : x-www-form-urlencoded
app.use(express.json()); // To parse the json()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: logger.stream }));
app.use(cookieParser());

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, "public", path.sep, "images"));
	},
	filename: function (req, file, cb) {
		const date = Date.now();
		const uploadFileName = file.originalname;
		cb(null, uploadFileName);
	},
});

const allowedFileTypes = (req, file, cb) => {
	const fileTypes = [".png", ".svg", ".jpg", ".jpeg"];

	const isFileTypeValid = fileTypes.includes(
		path.extname(file.originalname).toLowerCase()
	);

	if (isFileTypeValid) {
		return cb(null, true);
	} else {
		cb(
			new multer.MulterError(
				"Invalid file types. Please upload png or svg files with maximum 80 kilobytes in size."
			)
		);
	}
};

const upload = multer({
	storage: storage,
	fileFilter: allowedFileTypes,
	limits: { files: 5 },
});

/**
 * Import all of your routes below
 */
// Import here
require("./api/accounts.api")(app);
require("./api/cpo.api")(app, upload);

app.use("*", (req, res, next) => {
	logger.error({
		API_NOT_FOUND: {
			api: req.baseUrl,
			status: 404,
		},
	});
	return res.status(404).json({ status: 404, data: [], message: "Not Found" });
});

module.exports = app;
