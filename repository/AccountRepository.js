/**
 * @author Adrian Marcelo
 * @description This file contains all of the methods that directly interacts in the persistence layer.
 * All of the methods here can be used by the service layer.
 */
const mysql = require("../database/mysql");

module.exports = class AccountRepository {
	VerifyBasicToken(username, password) {
		const query = `call WEB_USER_VERIFY_BASIC_TOKEN(?,?)`;

		return new Promise((resolve, reject) => {
			mysql.query(query, [username, password], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * @description This method directly access the 'users' table. The responsibility of this table is to get a record
	 * that matches username and password.
	 * @param {Object} parameter {username, password}
	 * @returns {Promise}
	 */
	Login({ username, password }) {
		return new Promise((resolve, reject) => {
			try {
				mysql.getConnection((err, connection) => {
					if (err) {
						connection.release();
						reject(err);
					}

					connection.query(
						`SELECT id, username, password, role FROM users WHERE username = ? AND password = MD5(?)`,
						[username, password],
						(err, result) => {
							if (err) reject(err);

							resolve({ result, connection });
						}
					);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * @definition This method uses 'authorization_tokens' table. The responsibility of this method is to retrieve a
	 * record that matches the provided access token.
	 * @param {String} accessToken
	 * @returns {Promise}
	 */
	FindAccessToken(accessToken) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"SELECT access_token FROM authorization_tokens WHERE access_token = ?",
				[accessToken],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @definition This method uses 'authorization_tokens' table. The responsibility of this method is to retrieve a
	 * record that matches the provided refresh token.
	 * @param {String} refreshToken
	 * @returns {Promise}
	 */
	FindRefreshToken(refreshToken) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"SELECT refresh_token FROM authorization_tokens WHERE refresh_token = ?",
				[refreshToken],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @definition This method uses 'authorization_tokens' table. The responsibility of this method is to remove
	 * a session/record from the table that matches the provided user id.
	 * @param {Number} userID
	 * @returns {Promise}
	 */
	DeleteRefreshTokenWithUserID(userID) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"DELETE FROM authorization_tokens WHERE user_id = ?",
				[userID],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @definition This method uses 'authorization_tokens' table. The responsibility of this method is to remove
	 * the record/session from the table when it matches the user id, and access token.
	 * @param {Number} userID
	 * @param {String} accessToken
	 * @returns {Promise}
	 */
	Logout(userID, accessToken) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"DELETE FROM authorization_tokens WHERE user_id = ? AND access_token = ?",
				[userID, accessToken],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @description This method uses 'authorization_tokens' table. The responsibility of this method is to add a new session
	 * in the table.
	 * @param {Object} parameter {access_token: String, refresh_token: String, user_id: Number, connection: MySQL Connection}
	 * @returns {Promise}
	 */
	SaveAuthorizationInfo({ access_token, refresh_token, user_id, connection }) {
		return new Promise((resolve, reject) => {
			try {
				connection.query(
					`INSERT INTO authorization_tokens (user_id, access_token, refresh_token) VALUES(?,?,?)`,
					[user_id, access_token, refresh_token],
					(err, result) => {
						if (err) {
							connection.release();
							reject(err);
						}

						connection.release();
						resolve(result);
					}
				);
			} catch (err) {
				connection.release();
				reject(err);
			}
		});
	}

	/**
	 * @description This method uses 'authorization_tokens' table. The responsibility of this method is to update a session/record
	 * detail that matches the user id, and refresh token.
	 * @param {Object} parameters {user_id: Number, new_access_token: String, new_refresh_token: String, prev_refresh_token: String}
	 * @returns {Promise}
	 */
	UpdateAuthorizationInfo({
		user_id,
		new_access_token,
		new_refresh_token,
		prev_refresh_token,
	}) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"UPDATE authorization_tokens SET access_token = ?, refresh_token = ?, date_modified = NOW() WHERE user_id = ? AND refresh_token = ?",
				[new_access_token, new_refresh_token, user_id, prev_refresh_token],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @description This method uses Stored Procedures called CHECK_OTP_DAY. It is responsible for
	 * handling the OTP to be sent in users email.
	 * @param {Object} parameters {email: String, otp: Number, token: String, token_expiration: Number}
	 * @returns {Promise}
	 */
	SendOTP({ email, otp, token, token_expiration }) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"call WEB_USER_CHECK_USER_FORGOT_PASSWORD_PROFILES(?,?,?,?)",
				[email, otp, token, token_expiration],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @description This method uses Stored Procedure called CHECK_INPUT_OTP. It is responsible for
	 * verifying the OTP that the user is provided.
	 * @param {Object} parameters {user_id: Number, otp: Number}
	 * @returns {Promise}
	 */
	VerifyOTP({ user_id, otp }) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"call WEB_USER_CHECK_OTP(?,?)",
				[user_id, otp],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * @description This method uses Stored Procedure called CHANGE_PASSWORD. It is responsible for
	 * changing user's password.
	 * @param {Object} parameters {password: String, user_id: Number}
	 * @returns {Promise}
	 */
	ChangePassword({ password, user_id }) {
		return new Promise((resolve, reject) => {
			mysql.query(
				"call WEB_USER_CHANGE_PASSWORD(?,?)",
				[user_id, password],
				(err, result) => {
					if (err) {
						reject(err);
					}
					resolve(result);
				}
			);
		});
	}

	ChangeOldPassword({ user_id, old_password, new_password, confirm_password }) {
		const query = `call WEB_USER_CHANGE_OLD_PASSWORD(?,?,?,?)`;

		return new Promise((resolve, reject) => {
			mysql.query(
				query,
				[user_id, old_password, new_password, confirm_password],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}
};
