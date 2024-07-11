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

	InsertTemporaryData(data) {
		const QUERY = `
		
			INSERT INTO csv_temporary_table
				(cpo_owner_id,
				location_name,
				address,
				address_lat,
				address_lng,
				evse_sn,
				kwh,
				connectors,
				connector_format,
				power_type,
				max_voltage,
				max_amperage,
                max_electric_power,
                location_facilities,
                location_parking_types,
                evse_capabilities,
				evse_payment_types)
			VALUES ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [data], (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}
};
