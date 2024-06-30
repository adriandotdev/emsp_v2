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
const compression = require("compression");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();
const YAML = require("yamljs");
const multer = require("multer");

// Loggers
const morgan = require("morgan");
const logger = require("./config/winston");
const { HttpBadRequest } = require("./utils/HttpError");

// Global Middlewares
const swaggerDocument = YAML.load("./swagger.yaml");

// Graphql setup
const { createHandler } = require("graphql-http/lib/use/express");
const schema = require("./graphql/schema");

app.use("/login/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));

app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:5173",
			"https://v2-stg-parkncharge.sysnetph.com",
			"https://stg-cpo.sysnetph.com",
			"https://stg-findevplug.sysnetph.com",
			"https://findevplug.ph",
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
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(compression());

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

const allowedFileType = (req, file, cb) => {
	const fileTypes = [".csv"];

	const isFileTypeValid = fileTypes.includes(
		path.extname(file.originalname).toLowerCase()
	);

	if (isFileTypeValid) {
		return cb(null, true);
	} else {
		// cb(
		// 	new multer.MulterError(
		// 		"Invalid file types. Please upload png or svg files with maximum 80 kilobytes in size."
		// 	)
		// );
		throw new HttpBadRequest("INVALID_FILE_TYPE");
	}
};

const csvStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, "public", "csv"));
	},
	filename: function (req, file, cb) {
		const date = Date.now();
		const uploadFileName = file.originalname;
		cb(null, uploadFileName);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: allowedFileTypes,
	limits: { files: 5 },
});

const csvUpload = multer({
	storage: csvStorage,
	fileFilter: allowedFileType,
	limits: { files: 1 },
});
/**
 * Import all of your routes below
 */
// Import here
require("./api/accounts.api")(app);
require("./api/cpo.api")(app, upload);
require("./api/filters.api")(app);
require("./api/csv.api")(app, csvUpload);
require("./api/locations.api")(app);
app.use(
	"/ocpi/cpo/graphql",
	createHandler({
		schema,
		context: (req) => ({
			auth: req.headers.authorization,
		}),
		formatError: (error) => {
			return {
				message: error.originalError.message
					? error.originalError.message
					: "Internal Server Error",
				status: error.originalError.status ? error.originalError.status : 500,
			};
		},
	})
);

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
