const logger = require("../config/winston");
const FiltersService = require("../services/FiltersService");
const TokenMiddleware = require("../middlewares/TokenMiddleware");
/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	logger.info("Controller: filters.api.js initialized");
	const tokenMiddleware = new TokenMiddleware();
	const service = new FiltersService();

	/**
	 * API for retrieving default filters such as
	 * location facilities, parking types, capabilities etc.
	 */
	app.get(
		"/ocpi/cpo/2.2/filters",
		[tokenMiddleware.BasicTokenVerifier()],

		/**
		 *
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {*} next
		 */
		async (req, res, next) => {
			try {
				const result = await service.GetFilters();

				res.status(200).json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "GET_FILTERS_ERROR";
				next(err);
			}
		}
	);

	/**
	 * API for retrieving filters of cities
	 * based on specified province name.
	 */
	app.get(
		"/ocpi/cpo/2.2/filters/cities/:province_name",
		[tokenMiddleware.BasicTokenVerifier()],
		/**
		 *
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {*} next
		 */
		async (req, res, next) => {
			try {
				const result = await service.GetCitiesByProvince(
					req.params.province_name
				);

				res.status(200).json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "GET_CITIES_BY_PROVINCE_ERROR";
				next(err);
			}
		}
	);
};
