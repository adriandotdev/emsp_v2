const jwt = require("jsonwebtoken");
const JsonWebToken = require("../utils/JsonWebToken");
const {
	HttpUnauthorized,
	HttpInternalServerError,
	HttpForbidden,
} = require("../utils/HttpError");
const logger = require("../config/winston");
const Crypto = require("../utils/Crypto");
const AccountRepository = require("../repository/AccountRepository");

module.exports = class TokenMiddleware {
	#repository;

	/**
	 * @constructor
	 */
	constructor() {
		this.#repository = new AccountRepository();
	}
	/**
	 * @method AccessTokenVerifier
	 */
	AccessTokenVerifier() {
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		return async (req, res, next) => {
			// logger
			logger.info({
				ACCESS_TOKEN_VERIFIER_MIDDLEWARE: {
					access_token: req.headers["authorization"]?.split(" ")[1],
				},
			});

			try {
				const accessToken = req.headers["authorization"]?.split(" ")[1];

				if (!accessToken) throw new HttpUnauthorized("Unauthorized", []);

				const decryptedAccessToken = Crypto.Decrypt(accessToken); // throws Error when token is invalid to decrypt.

				const isAccessTokenExistingInDB =
					await this.#repository.FindAccessToken(decryptedAccessToken);

				if (isAccessTokenExistingInDB.length < 1)
					throw new HttpUnauthorized("Unauthorized", []);

				JsonWebToken.Verify(
					decryptedAccessToken,
					process.env.JWT_ACCESS_KEY,
					(err, decode) => {
						if (err) {
							if (err instanceof jwt.TokenExpiredError) {
								throw new HttpForbidden("Token Expired", []);
							} else if (err instanceof jwt.JsonWebTokenError) {
								throw new HttpUnauthorized("Invalid Token", []);
							} else {
								throw new HttpInternalServerError("Internal Server Error", []);
							}
						}

						if (
							decode.iss !== "parkncharge" ||
							decode.typ !== "Bearer" ||
							decode.aud !== "parkncharge-app" ||
							decode.usr !== "serv"
						)
							throw new HttpUnauthorized("Unauthorized", []);

						req.username = decode.data.username;
						req.id = decode.data.id;
						req.role_id = decode.data.role_id;
						req.role = decode.data.role;
						req.access_token = decryptedAccessToken;
						req.party_id = decode.data.party_id;
						req.cpo_owner_id = decode.data.cpo_owner_id;
					}
				);

				logger.info({
					ACCESS_TOKEN_VERIFIER_MIDDLEWARE: {
						message: "SUCCESS",
					},
				});
				next();
			} catch (err) {
				logger.error({
					ACCESS_TOKEN_VERIFIER_MIDDLEWARE_ERROR: {
						message: err.message,
					},
				});

				if (err !== null) {
					return res.status(err.status || 500).json({
						status: err.status || 500,
						data: err.data,
						message: err.message,
					});
				}

				return res
					.status(500)
					.json({ status: 500, data: [], message: "Internal Server Error" });
			}
		};
	}

	/**
	 * @method
	 */
	RefreshTokenVerifier() {
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */

		return async (req, res, next) => {
			logger.info({
				REFRESH_TOKEN_VERIFIER_MIDDLEWARE: {
					refresh_token: req.headers["authorization"]?.split(" ")[1],
				},
			});

			try {
				const refreshToken = req.headers["authorization"]?.split(" ")[1];

				if (!refreshToken) throw new HttpUnauthorized("Unauthorized", []);

				const decryptedRefreshToken = Crypto.Decrypt(refreshToken);

				const isRefreshTokenExisting = await this.#repository.FindRefreshToken(
					decryptedRefreshToken
				);

				if (isRefreshTokenExisting.length < 1) {
					JsonWebToken.Verify(
						decryptedRefreshToken,
						process.env.JWT_REFRESH_KEY,
						async (err, decode) => {
							if (err) throw new HttpForbidden("Forbidden", []);

							// Delete all access tokens associated with user
							logger.error({
								DELETE_REFRESH_TOKEN_WITH_USER_ID: { user_id: decode.data.id },
							});
							await this.#repository.DeleteRefreshTokenWithUserID(
								decode.data.id
							);
						}
					);

					throw new HttpForbidden("Forbidden", []);
				}

				JsonWebToken.Verify(
					decryptedRefreshToken,
					process.env.JWT_REFRESH_KEY,
					(err, decode) => {
						if (err) {
							if (err instanceof jwt.TokenExpiredError) {
								throw new HttpUnauthorized("Token Expired", []);
							} else if (err instanceof jwt.JsonWebTokenError) {
								throw new HttpUnauthorized("Invalid Token", []);
							} else {
								throw new HttpInternalServerError("Internal Server Error", []);
							}
						}

						if (
							decode.iss !== "parkncharge" ||
							decode.typ !== "Bearer" ||
							decode.aud !== "parkncharge-app" ||
							decode.usr !== "serv"
						)
							throw new HttpUnauthorized("Unauthorized", []);

						req.username = decode.data.username;
						req.id = decode.data.id;
						req.role_id = decode.data.role_id;
						req.role = decode.data.role;
						req.refresh_token = decryptedRefreshToken;
						req.party_id = decode.data.party_id;
						req.cpo_owner_id = decode.data.cpo_owner_id;
					}
				);

				logger.info({
					REFRESH_TOKEN_VERIFIER_MIDDLEWARE: {
						message: "Success",
					},
				});
				next();
			} catch (err) {
				if (err !== null) {
					return res.status(err.status ? err.status : 500).json({
						status: err.status ? err.status : 500,
						data: err.data,
						message: err.message,
					});
				}

				return res
					.status(500)
					.json({ status: 500, data: [], message: "Internal Server Error" });
			}
		};
	}

	/**
	 * @method
	 */
	BasicTokenVerifier() {
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		return async (req, res, next) => {
			// logger
			logger.info({
				BASIC_TOKEN_VERIFIER_MIDDLEWARE: {
					message: "REQUEST",
				},
			});

			try {
				const securityType = req.headers.authorization.split(" ")[0];
				const token = req.headers.authorization.split(" ")[1];

				if (securityType !== "Basic")
					throw new HttpForbidden(
						`Security Type: ${securityType} is invalid.`,
						[]
					);

				const decodedToken = new Buffer.from(token, "base64")
					.toString()
					.split(":");

				const username = decodedToken[0];
				const password = decodedToken[1];

				const result = await this.#repository.VerifyBasicToken(
					username,
					password
				);

				const status = result[0][0].STATUS;

				if (status === "INVALID_BASIC_TOKEN")
					throw new HttpForbidden(status, []);

				logger.info({
					BASIC_TOKEN_VERIFIER_MIDDLEWARE_SUCCESS: { message: "SUCCESS" },
				});

				next();
			} catch (err) {
				logger.error({
					BASIC_TOKEN_VERIFIER_MIDDLEWARE_ERROR: {
						message: err.message,
					},
				});

				if (err !== null) {
					return res.status(err.status ? err.status : 500).json({
						status: err.status ? err.status : 500,
						data: err.data,
						message: err.message,
					});
				}

				return res
					.status(500)
					.json({ status: 500, data: [], message: "Internal Server Error" });
			}
		};
	}

	VerifyCPOToken() {
		/**
		 * @param {import('express').Request} req
		 */
		return async (req, res, next) => {
			try {
				const securityType = req.headers["authorization"]?.split(" ")[0];
				const token = req.headers["authorization"]?.split(" ")[1];

				if (!token) throw new HttpUnauthorized("Unauthorized", []);

				if (securityType !== "Bearer")
					throw new HttpUnauthorized("Unauthorized", []);

				const party_id = req.params.party_id;

				const decodedToken = JSON.parse(Crypto.Decrypt(token));

				if (decodedToken.party_id !== party_id)
					throw new HttpForbidden("Forbidden", []);

				req.party_id = party_id;

				next();
			} catch (err) {
				next(err);
				req.error_name = "VERIFY_CPO_TOKEN_ERROR";
			}
		};
	}
};
