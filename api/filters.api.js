const logger = require("../config/winston");
const FiltersService = require("../services/FiltersService");
const TokenMiddleware = require("../middlewares/TokenMiddleware");
/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const tokenMiddleware = new TokenMiddleware();
	const service = new FiltersService();
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
};
