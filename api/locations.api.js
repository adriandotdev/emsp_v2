const LocationService = require("../services/LocationService");
const CSVRepository = require("../repository/CSVRepository");
const LocationRepository = require("../repository/LocationRepository");

const TokenMiddleware = require("../middlewares/TokenMiddleware");

const logger = require("../config/winston");
const { body, validationResult } = require("express-validator");

const { HttpUnprocessableEntity } = require("../utils/HttpError");
/**
 * @param {import('express').Express} app
 * @param {import('multer').Multer} upload
 */
module.exports = (app, upload) => {
	const service = new LocationService(
		new CSVRepository(),
		new LocationRepository()
	);
	const tokenMiddleware = new TokenMiddleware();

	/**
	 * This function will be used by the express-validator for input validation,
	 * and to be attached to APIs middleware.
	 * @param {*} req
	 * @param {*} res
	 */
	function validate(req, res) {
		const ERRORS = validationResult(req);

		if (!ERRORS.isEmpty()) {
			throw new HttpUnprocessableEntity(
				"Unprocessable Entity",
				ERRORS.mapped()
			);
		}
	}

	// Webhook API for adding new locations
	app.post(
		"/ocpi/cpo/api/v1/webhook/locations/:country_code/:party_id",
		[
			tokenMiddleware.VerifyCPOToken(),
			body("locations")
				.notEmpty()
				.withMessage("Missing required property: locations")
				.isArray()
				.withMessage("Property: locations must be array"),
			body("locations.*.name")
				.notEmpty()
				.withMessage("Missing required property: location.name"),
			body("locations.*.address")
				.notEmpty()
				.withMessage("Missing required property: location.address"),
			body("locations.*.evses")
				.notEmpty()
				.withMessage("Missing required property: location.evses")
				.isArray()
				.withMessage("Property: location.evses must be an array"),
			body("locations.*.evses.*.uid")
				.notEmpty()
				.withMessage("Missing required property: evses.uid"),
			body("locations.*.evses.*.status")
				.notEmpty()
				.withMessage("Missing required property: evses.status"),
			body("locations.*.evses.*.meter_type")
				.notEmpty()
				.withMessage("Missing required property: evses.meter_type"),
			body("locations.*.evses.*.kwh")
				.notEmpty()
				.withMessage("Missing required property: evses.kwh"),
			body("locations.*.evses.*.connectors")
				.notEmpty()
				.withMessage("Missing required property: connectors")
				.isArray()
				.withMessage("Property: evses.connectors must be an array"),
			body("locations.*.evses.*.connectors.*.standard")
				.notEmpty()
				.withMessage("Missing required property: connectors.standard"),
			body("locations.*.evses.*.connectors.*.format")
				.notEmpty()
				.withMessage("Missing required property: connectors.format"),
			body("locations.*.evses.*.connectors.*.power_type")
				.notEmpty()
				.withMessage("Missing required property: connectors.power_type"),
			body("locations.*.evses.*.connectors.*.max_voltage")
				.notEmpty()
				.withMessage("Missing required property: connectors.max_voltage")
				.isInt()
				.withMessage("Property: connectors.max_voltage must be an integer"),
			body("locations.*.evses.*.connectors.*.max_amperage")
				.notEmpty()
				.withMessage("Missing required property: connectors.max_amperage")
				.isInt()
				.withMessage("Property: connectors.max_amperage must be an integer"),
			body("locations.*.evses.*.connectors.*.max_electric_power")
				.notEmpty()
				.withMessage()
				.isInt()
				.withMessage(
					"Property: connectors.max_electric_power must be an integer"
				),
			body("locations.*.evses.*.capabilities")
				.notEmpty()
				.withMessage("Missing required connector property: capabilities")
				.isArray()
				.withMessage("Property: capabilities must be an array"),
			body("locations.*.evses.*.payment_types")
				.notEmpty()
				.withMessage("Missing required connector property: payment_types")
				.isArray()
				.withMessage("Property: payment_types must be an array"),
			body("locations.*.facilities")
				.notEmpty()
				.withMessage("Missing required connector property: facilities")
				.isArray()
				.withMessage("Property: facilities must be an array"),
			body("locations.*.parking_types")
				.notEmpty()
				.withMessage("Missing required connector property: parking_types")
				.isArray()
				.withMessage("Property: parking_types must be an array"),
			body("locations.*.parking_restrictions")
				.notEmpty()
				.withMessage(
					"Missing required connector property: parking_restrictions"
				)
				.isArray()
				.withMessage("Property: parking_restrictions must be an array"),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		async (req, res, next) => {
			try {
				logger.info({
					WEBHOOK_ADD_LOCATIONS_REQUEST: {
						data: {
							...req.body.locations,
						},
						message: "SUCCESS",
					},
				});

				validate(req, res);

				const result = await service.RegisterAllLocationsAndEVSEs(
					req.party_id,
					req.body.locations
				);

				logger.info({
					WEBHOOK_ADD_LOCATIONS_RESPONSE: {
						message: "SUCCESS",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				err.error_name = "WEBHOOK_ADD_LOCATIONS_ERROR";
				next(err);
			}
		}
	);

	// Webhook API for adding evse to a certain location
	app.post(
		"/ocpi/cpo/api/v1/webhook/evse/:country_code/:party_id",
		[
			tokenMiddleware.VerifyCPOToken(),
			body("location_id")
				.notEmpty()
				.withMessage("Missing required property: location_id"),
			body("uid").notEmpty().withMessage("Missing required property: uid"),
			body("meter_type")
				.notEmpty()
				.withMessage("Missing required property: meter_type")
				.custom((value) => ["AC", "DC"].includes(value))
				.withMessage("INVALID_METER_TYPE: VALID VALUES ARE [AC, DC]"),
			body("kwh").notEmpty().withMessage("Missing required property: kwh"),
			body("connectors")
				.notEmpty()
				.withMessage("Missing required property: connectors")
				.isArray()
				.withMessage("Property: connectors must be an array"),
			body("connectors.*.standard")
				.notEmpty()
				.withMessage("Missing required connector property: standard"),
			body("connectors.*.format")
				.notEmpty()
				.withMessage("Missing required connector property: format"),
			body("connectors.*.power_type")
				.notEmpty()
				.withMessage("Missing required connector property: power_type")
				.custom((value) => ["AC", "DC"].includes(value))
				.withMessage("INVALID_POWER_TYPE: VALID VALUES ARE [AC, DC]"),
			body("connectors.*.max_voltage")
				.notEmpty()
				.withMessage("Missing required connector property: max_voltage")
				.isInt()
				.withMessage("Property: connector max_voltage must be an integer"),
			body("connectors.*.max_amperage")
				.notEmpty()
				.withMessage("Missing required connector property: max_amperage")
				.isInt()
				.withMessage("Property: connector max_amperage must be an integer"),
			body("connectors.*.max_electric_power")
				.notEmpty()
				.withMessage("Missing required connector property: max_electric_power")
				.isInt()
				.withMessage(
					"Property: connector max_electric_power must be an integer"
				),
			body("capabilities")
				.notEmpty()
				.withMessage("Missing required connector property: capabilities")
				.isArray()
				.withMessage("Property: capabilities must be an array"),
			body("payment_types")
				.notEmpty()
				.withMessage("Missing required connector property: payment_types")
				.isArray()
				.withMessage("Property: payment_types must be an array"),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		async (req, res, next) => {
			try {
				logger.info({
					WEBHOOK_ADD_EVSE_REQUEST: {
						data: {
							...req.body,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.RegisterEVSE(req.body);
				logger.info({
					WEBHOOK_ADD_EVSE_RESPONSE: {
						message: "SUCCESS",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				err.error_name = "WEBHOOK_ADD_EVSE_ERROR";
				next(err);
			}
		}
	);

	// API for uploading location photos
	app.post(
		"/ocpi/cpo/api/v1/locations/photos/uploads",
		[tokenMiddleware.AccessTokenVerifier(), upload.array("location_photos", 5)],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		async (req, res, next) => {
			try {
				logger.info({
					UPLOAD_LOCATION_PHOTOS_REQUEST: {
						data: {
							location_id: req.body.location_id,
							files: req.files.map((file) => file.filename),
						},
					},
				});

				await service.UploadLocationPhotos(req.files, req.body.location_id);

				logger.info({
					UPLOAD_LOCATION_PHOTOS_RESPONSE: {
						message: "SUCCESS",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: [], message: "Success" });
			} catch (err) {
				req.error_name = "UPLOAD_LOCATION_PHOTOS_ERROR";
				next(err);
			}
		}
	);

	// API for updating location photo by ID
	app.patch(
		"/ocpi/cpo/api/v1/locations/photos/uploads/:photo_id",
		[tokenMiddleware.AccessTokenVerifier(), upload.single("location_photo")],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		async (req, res, next) => {
			try {
				logger.info({
					UPLOAD_PHOTO_BY_ID_REQUEST: {
						data: {
							photo_id: req.params.photo_id,
							file_name: req.file.filename,
						},
					},
				});

				await service.UpdateLocationPhotoByID(
					req.params.photo_id,
					req.file.filename
				);

				logger.info({
					UPLOAD_LOCATION_PHOTOS_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: [], message: "Success" });
			} catch (err) {
				req.error_name = "UPLOAD_PHOTO_BY_ID_ERROR";
				next(err);
			}
		}
	);

	app.use((err, req, res, next) => {
		logger.error({
			API_REQUEST_ERROR: {
				message: err.message,
				stack: err.stack.replace(/\\/g, "/"), // Include stack trace for debugging
				request: {
					method: req.method,
					url: req.url,
					code: err.status || 500,
				},
				data: err.data || [],
			},
		});

		const status = err.status || 500;
		const message = err.message || "Internal Server Error";

		res.status(status).json({
			status,
			data: err.data || [],
			message,
		});
	});
};
