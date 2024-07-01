const LocationService = require("../services/LocationService");
const CSVRepository = require("../repository/CSVRepository");
const LocationRepository = require("../repository/LocationRepository");

const TokenMiddleware = require("../middlewares/TokenMiddleware");

const logger = require("../config/winston");

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const service = new LocationService(
		new CSVRepository(),
		new LocationRepository()
	);
	const tokenMiddleware = new TokenMiddleware();

	app.post(
		"/ocpi/cpo/webhook/locations",
		[tokenMiddleware.AccessTokenVerifier()],

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
				err.error_name = "WEBHOOK_ADD_LOCATIONS";
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
