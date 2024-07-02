const mysql = require("../database/mysql");

module.exports = class CSVRepository {
	GetConnection() {
		return new Promise((resolve, reject) => {
			mysql.getConnection((err, connection) => {
				if (err) {
					reject(err);
				}

				resolve(connection);
			});
		});
	}

	GetCPOOwnerIDByPartyID(partyID) {
		const QUERY = `
			SELECT 
				id
			FROM 
				cpo_owners
			WHERE party_id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [partyID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	SearchLocationByName(name) {
		const QUERY = `
			SELECT
				id,
				name
			FROM
				cpo_locations
			WHERE 
				LOWER(name) = LOWER(?)
			LIMIT 1
		`;
		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [name], (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}
};
