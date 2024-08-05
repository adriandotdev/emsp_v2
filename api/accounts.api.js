/**
 * @Author Adrian Marcelo
 *
 * This file contains all of the APIs for user accounts such as:
 * - Login
 * - Logout
 * - Forgot Password
 * - Send OTP
 * - Verify OTP
 */

// External Packages
const { validationResult, body, param } = require("express-validator");

// Service
const AccountService = require("../services/AccountService");

// HttpErrors
const { HttpUnprocessableEntity } = require("../utils/HttpError");

// Config Files
const logger = require("../config/winston");

// Midlewares
const TokenMiddleware = require("../middlewares/TokenMiddleware");

// Utilities
const JsonWebToken = require("../utils/JsonWebToken");
const Crypto = require("../utils/Crypto");

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	logger.info("Controller: accounts.api.js initialized");
	const service = new AccountService();
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

	/**
	 * API for account login
	 */
	app.post(
		"/ocpi/cpo/api/auth/v1/login",
		[
			tokenMiddleware.BasicTokenVerifier(),
			body("username")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: username"),
			body("password")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: password"),
		],
		async (req, res, next) => {
			const { username, password } = req.body;

			logger.info({
				LOGIN_API_REQUEST: {
					username,
					password,
				},
			});

			try {
				validate(req, res);

				const data = await service.Login({ username, password });

				logger.info({ LOGIN_API_RESPONSE: { data } });

				return res.status(200).json({ status: 200, data, message: "SUCCESS" });
			} catch (err) {
				next(err);
			}
		}
	);

	/** API for account logout */
	app.post(
		"/ocpi/cpo/api/auth/v1/logout",
		tokenMiddleware.AccessTokenVerifier(),
		async (req, res, next) => {
			logger.info({
				LOGOUT_API_REQUEST: {
					username: req.username,
					access_token: req.access_token,
				},
			});

			try {
				await service.Logout(req.id, req.access_token);

				logger.info({
					LOGOUT_API_RESPONSE: {
						message: "Logged out successfully",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: [], message: "Logged out successfully" });
			} catch (err) {
				next(err);
			}
		}
	);

	/** API for generating new tokens (access and refresh tokens) */
	app.get(
		"/ocpi/cpo/api/auth/v1/refresh",
		tokenMiddleware.RefreshTokenVerifier(),
		async (req, res, next) => {
			logger.info({
				REFRESH_TOKEN_API_REQUEST: {
					username: req.username,
					refresh_token: req.refresh_token,
				},
			});

			try {
				const response = await service.GenerateNewRefreshToken(
					req.refresh_token
				);

				logger.info({
					REFRESH_TOKEN_API_RESPONSE: {
						message: "Success",
						data: response,
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: response, message: "Success" });
			} catch (err) {
				next(err);
			}
		}
	);

	app.post(
		"/login/api/auth/v1/send-otp",
		[
			tokenMiddleware.BasicTokenVerifier(),
			body("email").notEmpty().withMessage("Missing required property: email"),
		],
		async (req, res, next) => {
			const { email } = req.body;

			logger.info({
				SEND_OTP_API_REQUEST: {
					email,
				},
			});

			try {
				validate(req, res);

				const response = await service.SendOTP(
					email.trim().replace(/\s+/gi, "")
				);

				logger.info({
					SEND_OTP_API_RESPONSE: {
						user_id: response.USER_ID,
						status: response.STATUS,
					},
				});
				return res.json({ status: 200, data: response, message: "Success" });
			} catch (err) {
				next(err);
			}
		}
	);

	app.post(
		"/login/api/auth/v1/verify-otp",
		[
			tokenMiddleware.BasicTokenVerifier(),
			body("user_id")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: user_id")
				.custom((value) => typeof value === "string")
				.withMessage("Property user_id must be in type of number")
				.custom(
					(value) =>
						parseInt(value) == value && typeof parseInt(value) === "number"
				)
				.withMessage("Property user_id must be in type of number"),
			body("otp")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: otp")
				.custom(
					(value) =>
						typeof parseInt(value) === "number" && String(value).length === 6
				)
				.withMessage(
					"Property otp must be in number type with a length of six (6) digits"
				),
		],
		async (req, res, next) => {
			const { user_id, otp } = req.body;

			logger.info({
				VERIFY_OTP_API_REQUEST: {
					user_id,
					otp,
				},
			});
			try {
				validate(req, res);

				const response = await service.VerifyOTP({ user_id, otp });

				logger.info({
					VERIFY_OTP_API_RESPONSE: {
						message: "Correct OTP",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: response, message: "Success" });
			} catch (err) {
				next(err);
			}
		}
	);

	app.post(
		"/login/api/auth/v1/change-password/:user_id",
		[
			tokenMiddleware.BasicTokenVerifier(),
			body("password")
				.notEmpty()
				.withMessage("Missing required property: password")
				.isLength({ min: 8 })
				.withMessage(
					"Required property: password must be atleast eight (8) characters long."
				)
				.custom((value) => String(value).match(/^[a-zA-Z0-9]+$/))
				.withMessage("Property password only accepts alphanumeric values"),
			param("user_id")
				.notEmpty()
				.withMessage("Missing required property: user_id")
				.custom(
					(value) =>
						parseInt(value) == value && typeof parseInt(value) === "number"
				)
				.withMessage("Property user_id must be in type of number"),
		],
		async (req, res, next) => {
			const { user_id } = req.params;
			const { password } = req.body;

			logger.info({
				CHANGE_PASSWORD_API_REQUEST: {
					user_id,
					password,
				},
			});
			try {
				validate(req, res);

				const response = await service.ChangePassword({
					password,
					user_id,
				});

				logger.info({
					CHANGE_PASSWORD_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res.status(200).json({
					status: 200,
					data: [{ status: response }],
					message: "Success",
				});
			} catch (err) {
				next(err);
			}
		}
	);

	app.post(
		"/ocpi/cpo/api/auth/v1/change-old-password",
		[
			tokenMiddleware.AccessTokenVerifier(),
			body("old_password")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: old_password")
				.custom((value) => String(value).match(/^[a-zA-Z0-9]+$/))
				.withMessage("Property old_password only accepts alphanumeric values"),
			body("new_password")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: new_password")
				.custom((value) => String(value).match(/^[a-zA-Z0-9]+$/))
				.withMessage("Property new_password only accepts alphanumeric values"),
			body("confirm_password")
				.notEmpty()
				.escape()
				.withMessage("Missing required property: confirm_password")
				.custom((value) => String(value).match(/^[a-zA-Z0-9]+$/))
				.withMessage(
					"Property confirm_password only accepts alphanumeric values"
				),
		],
		async (req, res, next) => {
			logger.info({ CHANGE_OLD_PASSWORD_API_REQUEST: { message: "SUCCESS" } });

			try {
				validate(req, res);

				const result = await service.ChangeOldPassword({
					user_id: req.id,
					...req.body,
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				next(err);
			}
		}
	);

	app.get(
		"/login/api/v1/accounts/users/info",
		[tokenMiddleware.AccessTokenVerifier()],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				logger.info({
					USER_ACCOUNT_INFORMATION_REQUEST: {
						data: {
							user_id: req.id,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.GetUserDetails(req.id);

				logger.info({
					USER_ACCOUNT_INFORMATION_RESPONSE: {
						message: "SUCCESS",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
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
