const logger = require("../config/winston");

const CSVService = require("../services/CSVService");
const CSVRepository = require("../repository/CSVRepository");

const TokenMiddleware = require("../middlewares/TokenMiddleware");

/**
 * @param {import('express').Express} app
 * @param {import('multer').Multer} csvUpload
 */
module.exports = (app, csvUpload) => {
	const service = new CSVService(new CSVRepository());
	const tokenMiddleware = new TokenMiddleware();

	app.post(
		"/ocpi/cpo/api/v1/locations/uploads/csv/:party_id",
		[tokenMiddleware.VerifyCPOToken(), csvUpload.single("file")],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				// Read CSV, and transform into JSON
				const locations = await service.ReadCSVFile(req.file.filename);
				const result = await service.RegisterAllLocationsAndEVSEs(
					req.party_id,
					locations
				);

				return res
					.status(200)
					.json({ status: 200, data: locations, message: "Success" });
			} catch (err) {
				req.error_name = "CSV_UPLOAD_ERROR";
				next(err);
			}
		}
	);

	app.use((err, req, res, next) => {
		logger.error({
			API_REQUEST_ERROR: {
				error_name: req.error_name || "UNKNOWN_ERROR",
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
