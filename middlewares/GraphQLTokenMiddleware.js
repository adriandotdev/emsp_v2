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

module.exports = class GraphQLTokenMiddleware {
	#repository;

	constructor() {
		this.#repository = new AccountRepository();
	}

	async AccessTokenVerifier(authorization) {
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */

		// logger
		logger.info({
			ACCESS_TOKEN_VERIFIER_MIDDLEWARE: {
				data: {
					authorization,
				},
			},
		});

		try {
			const accessToken = authorization?.split(" ")[1];

			if (!accessToken) throw new HttpUnauthorized("Unauthorized", []);

			const decryptedAccessToken = Crypto.Decrypt(accessToken); // throws Error when token is invalid to decrypt.

			const isAccessTokenExistingInDB = await this.#repository.FindAccessToken(
				decryptedAccessToken
			);

			if (isAccessTokenExistingInDB.length < 1)
				throw new HttpUnauthorized("Unauthorized", []);

			let data = {};

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

					data.username = decode.data.username;
					data.id = decode.data.id;
					data.role_id = decode.data.role_id;
					data.role = decode.data.role;
					data.access_token = decryptedAccessToken;
					data.party_id = decode.data.party_id;
					data.cpo_owner_id = decode.data.cpo_owner_id;
				}
			);

			logger.info({
				ACCESS_TOKEN_VERIFIER_MIDDLEWARE: {
					message: "SUCCESS",
				},
			});

			return data;
		} catch (err) {
			throw err;
		}
	}
};
