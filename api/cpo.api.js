const TokenMiddleware = require("../middlewares/TokenMiddleware");
const { validationResult, body, param } = require("express-validator");

const logger = require("../config/winston");

// Import your SERVICE HERE
const CPOService = require("../services/CPOService");

const CPORepository = require("../repository/CPORepository");

// Import MISC HERE
const { HttpUnprocessableEntity } = require("../utils/HttpError");
/**
 * @param {import('express').Express} app
 * @param {import('multer').Multer} upload
 */
module.exports = (app, upload) => {
	const service = new CPOService(new CPORepository());
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

	// API for registering new Charging Point Operator.
	app.post(
		"/ocpi/cpo/2.2/register",
		[
			tokenMiddleware.BasicTokenVerifier(),
			body("username")
				.notEmpty()
				.withMessage("Missing required property: username"),
			body("cpo_owner_name")
				.notEmpty()
				.withMessage("Missing required property: cpo_owner_name"),
			body("contact_name")
				.notEmpty()
				.withMessage("Missing required property: contact_name"),
			body("contact_number")
				.notEmpty()
				.withMessage("Missing required property: contact_number")
				.custom((value) => String(value).match(/^\+63\d{10}$|^09\d{9}$/))
				.withMessage(
					`Error: The acceptable formats are +639XXXXXXXXX or 09XXXXXXXXX.`
				),
			body("contact_email")
				.notEmpty()
				.withMessage("Missing required property: contact_email")
				.custom((value) =>
					String(value).match(
						/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
					)
				)
				.withMessage("Error: Invalid email address"),
			body("ocpp_ready")
				.optional()
				.notEmpty()
				.withMessage("Missing required property: occp_ready")
				.isBoolean({ strict: true })
				.withMessage(
					"Invalid value for occp_ready: It must be in boolean type"
				),
			body("logo").optional(),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					REGISTER_CPO_REQUEST: {
						data: {
							...req.body,
						},
						message: "SUCCESS",
					},
				});

				validate(req, res);

				const result = await service.RegisterCPO({ ...req.body });

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "REGISTER_CPO_ERROR";
				next(err);
			}
		}
	);

	// API for registering location with evses.
	app.put(
		"/ocpi/registration/hub/2.2/locations/:country_code/:party_id",
		[
			tokenMiddleware.VerifyCPOToken(),
			body("name")
				.notEmpty()
				.withMessage("Missing required property: name (Location name"),
			body("address")
				.notEmpty()
				.withMessage("Missing required property: address"),
			body("coordinates")
				.notEmpty()
				.withMessage("Missing required property: coordinates")
				.isObject()
				.withMessage("Property coordinates must be an object"),
			body("coordinates.latitude")
				.notEmpty()
				.withMessage("Missing required property: coordinates.latitude"),
			body("coordinates.longitude")
				.notEmpty()
				.withMessage("Missing required property: coordinates.longitude"),
			body("evses")
				.notEmpty()
				.withMessage("Missing required property: evses")
				.isArray()
				.withMessage("EVSEs must be type of array")
				.custom((value) => {
					if (value.length !== 1)
						throw new Error("EVSE array must contain exactly one (1) element.");

					return true;
				})
				.withMessage("EVSEs must contain exactly one (1)."),
			body("evses.*.uid")
				.notEmpty()
				.withMessage("Missing evse property: uid")
				.custom((value) => typeof value === "string")
				.withMessage("EVSE uid must be type of string"),
			body("evses.*.status")
				.notEmpty()
				.withMessage("Missing evse property: status")
				.custom((value) =>
					["AVAILABLE", "OFFLINE", "CHARGING", "RESERVED"].includes(value)
				)
				.withMessage(
					"Invalid EVSE status. Valid statuses are: [AVAILABLE, OFFLINE, CHARGING, RESERVED]"
				),
			body("evses.*.meter_type")
				.notEmpty()
				.withMessage("Missing evse property: meter_type")
				.custom((value) => ["AC", "DC"].includes(value))
				.withMessage(
					"Invalid EVSE meter type. Valid meter types are: [AC, DC]"
				),
			body("evses.*.kwh")
				.notEmpty()
				.withMessage("Missing evse property: kwh")
				.custom((value) => typeof value === "number"),
			body("evses.*.connectors")
				.notEmpty()
				.withMessage("Missing evse property: connectors")
				.isArray()
				.withMessage("Connectors must be array type")
				.custom((value) => {
					if (value.length !== 1) {
						throw new Error(
							"EVSE Connectors must contain exactly one (1) element."
						);
					}

					return true;
				}),
			body("evses.*.connectors.*.standard")
				.notEmpty()
				.withMessage("Missing connector property: standard"),
			body("evses.*.connectors.*.format")
				.notEmpty()
				.withMessage("Missing connector property: format"),
			body("evses.*.connectors.*.power_type")
				.notEmpty()
				.withMessage("Missing connector property: power_type"),
			body("evses.*.connectors.*.max_voltage")
				.notEmpty()
				.withMessage("Missing connector property: max_voltage"),
			body("evses.*.connectors.*.max_amperage")
				.notEmpty()
				.withMessage("Missing connector property: max_amperage"),
			body("evses.*.connectors.*.max_electric_power")
				.notEmpty()
				.withMessage("Missing connector property: max_electric_power"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					REGISTER_LOCATIONS_AND_EVSE_REQUEST: {
						data: {
							...req.body,
						},
						message: "SUCCESS",
					},
				});

				validate(req, res);

				const result = await service.RegisterLocationAndEVSEs({
					...req.body,
					party_id: req.party_id,
				});

				logger.info({
					REGISTER_LOCATIONS_AND_EVSE_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "SUCCESS" });
			} catch (err) {
				req.error_name = "REGISTER_LOCATIONS_AND_EVSE_ERROR";
				next(err);
			}
		}
	);

	// API for uploading CPO logo.
	app.post(
		"/ocpi/cpo/2.2/cpo/upload",
		[tokenMiddleware.BasicTokenVerifier(), upload.single("cpo_logo")],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			console.log(req.file);
			return res
				.status(200)
				.json({ status: 200, data: [], message: "Success" });
		}
	);

	// API for updating CPO logo.
	app.patch(
		"/ocpi/cpo/2.2/cpo/logo/upload",
		[tokenMiddleware.AccessTokenVerifier()],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					UPDATE_CPO_LOGO_REQUEST: {
						data: {
							cpo_id: req.cpo_owner_id,
							logo: req.body.logo,
						},
						message: "SUCCESS",
					},
				});

				await service.UpdateCPOLogoByID(req.cpo_owner_id, req.body.logo);

				logger.info({
					UPDATE_CPO_LOGO_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: [], message: "Success" });
			} catch (err) {
				req.error_name = "UPDATE_CPO_LOGO_ERROR";
				next(err);
			}
		}
	);

	// API for retrieving CPO details.
	app.get(
		"/ocpi/cpo/2.2/details",
		[tokenMiddleware.AccessTokenVerifier()],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					GET_CPO_DETAILS_REQUEST: {
						data: {
							cpo_id: req.cpo_owner_id,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.GetCPODetailsByID(req.cpo_owner_id);

				logger.info({
					GET_CPO_DETAILS_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "GET_CPO_DETAILS_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/ocpi/cpo/2.2/locations/pending",
		[tokenMiddleware.AccessTokenVerifier()],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					GET_PENDING_LOCATIONS_REQUEST: {
						data: {
							cpo_id: req.cpo_owner_id,
						},
					},
				});

				const result = await service.GetPendingLocationsAndEVSEs(
					req.cpo_owner_id
				);

				logger.info({
					GET_PENDING_LOCATIONS_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "GET_PENDING_LOCATIONS_ERROR";
				next(err);
			}
		}
	);

	app.use((err, req, res, next) => {
		logger.error({
			API_REQUEST_ERROR: {
				error_name: req.error_name || "UNKNOWN_ERROR",
				message: err.message,
				stack: err.stack?.replace(/\\/g, "/"), // Include stack trace for debugging
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
