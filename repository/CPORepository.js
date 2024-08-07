const mysql = require("../database/mysql");

module.exports = class CPORepository {
	/**
	 * Establishes a database connection and begins a transaction.
	 *
	 * This function retrieves a database connection from the connection pool, begins a transaction,
	 * and returns the connection object. It allows performing multiple database operations within
	 * a single transaction to ensure data integrity.
	 *
	 * @function GetConnection
	 * @returns {Promise<Connection>} A promise that resolves to a database connection object with an active transaction.
	 */
	GetConnection() {
		return new Promise((resolve, reject) => {
			mysql.getConnection((err, connection) => {
				if (err) {
					reject(err);
				}

				connection.beginTransaction((err) => {
					if (err) {
						connection.release();
						reject(err);
					}

					resolve(connection);
				});
			});
		});
	}

	CheckIfCPOExistsByName(cpoOwnerName) {
		const QUERY = `

			SELECT party_id, cpo_owner_name, token_c 
			FROM cpo_owners 
			WHERE LOWER(cpo_owner_name) = LOWER(?);
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoOwnerName], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
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

	RegisterCPO(data) {
		const QUERY = `
            CALL EMSP_REGISTER_CPO(?,?,?,?,?,?,?,?,?,?)
        `;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[
					data.username,
					data.password,
					data.party_id,
					data.cpo_owner_name,
					data.contact_name,
					data.contact_number,
					data.contact_email,
					data.ocpp_ready,
					data.token_c,
					data.logo || "default.svg",
				],
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
	 * Registers a new location.
	 *
	 * @function RegisterLocation
	 * @param {Object} locationData - An object containing location data.
	 * @param {string} locationData.cpo_owner_id - The ID of the Charging Point Operator (CPO) owning the location.
	 * @param {string} locationData.name - The name of the location.
	 * @param {string} locationData.address - The address of the location.
	 * @param {number} locationData.lat - The latitude coordinate of the location.
	 * @param {number} locationData.lng - The longitude coordinate of the location.
	 * @param {string} locationData.city - The city of the location.
	 * @param {string} locationData.region - The region or state of the location.
	 * @param {string} locationData.postal_code - The postal code of the location.
	 * @param {string[]} locationData.images - An array of image URLs associated with the location.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation, representing the registered location.
	 */
	RegisterLocation(
		{
			cpo_owner_id,
			name,
			address,
			lat,
			lng,
			city,
			region,
			postal_code,
			images,
		},
		connection
	) {
		const QUERY = `
			INSERT INTO 
				cpo_locations 
					(cpo_owner_id, name, address, address_lat, address_lng, city, region, postal_code, country_code, images, date_created, date_modified)
			VALUES 
					(?,?,?,?,?,?,?,?,?,?, NOW(), NOW());
		`;

		return new Promise((resolve, reject) => {
			connection.query(
				QUERY,
				[
					cpo_owner_id,
					name,
					address,
					lat,
					lng,
					city,
					region,
					postal_code,
					"PH",
					images,
				],
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
	 * Registers a new Electric Vehicle Supply Equipment (EVSE) in the system.
	 *
	 * @function RegisterEVSE
	 * @param {Object} data - The data required to register the EVSE.
	 * @param {string} data.uid - The unique identifier for the EVSE.
	 * @param {string} data.model - The model of the EVSE.
	 * @param {string} data.vendor - The vendor of the EVSE.
	 * @param {string} data.serial_number - The serial number of the EVSE.
	 * @param {string} data.box_serial_number - The box serial number of the EVSE.
	 * @param {string} data.firmware_version - The firmware version of the EVSE.
	 * @param {string} data.iccid - The ICCID of the EVSE.
	 * @param {string} data.imsi - The IMSI of the EVSE.
	 * @param {string} data.meter_type - The meter type of the EVSE.
	 * @param {string} data.meter_serial_number - The meter serial number of the EVSE.
	 * @param {string} [data.location_id] - The location ID where the EVSE is installed (optional).
	 * @returns {Promise<Object>} A promise that resolves to an object containing the result of the registration and the database connection.
	 */
	RegisterEVSE(data, connection) {
		const QUERY = `
           CALL EMSP_REGISTER_EVSE(?,?,?,?,?,?,?,?,?,?,?)
        `;

		return new Promise((resolve, reject) => {
			connection.query(
				QUERY,
				[
					data.uid,
					data.model,
					data.vendor,
					data.serial_number,
					data.box_serial_number,
					data.firmware_version,
					data.iccid,
					data.imsi,
					data.meter_type,
					data.meter_serial_number,
					data.location_id || null,
				],
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
	 * Adds connectors to an Electric Vehicle Supply Equipment (EVSE).
	 *
	 * @function AddConnector
	 * @param {string} uid - The unique identifier of the EVSE.
	 * @param {Array<Object>} data - An array of connector data objects.
	 * @param {string} data[].standard - The standard of the connector.
	 * @param {string} data[].format - The format of the connector.
	 * @param {number} data[].power_type - The power type ID of the connector.
	 * @param {number} data[].max_voltage - The maximum voltage of the connector.
	 * @param {number} data[].max_amperage - The maximum amperage of the connector.
	 * @param {number} data[].max_electric_power - The maximum electric power of the connector.
	 * @param {number} data[].rate_setting - The rate setting of the connector in KW-H.
	 * @param {Object} connection - The database connection object.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation.
	 */
	AddConnector(uid, data, connection) {
		const QUERY = `
            INSERT INTO evse_connectors (
                evse_uid,
				connector_id,
                standard,
                format,
                power_type,
                max_voltage,
                max_amperage,
                max_electric_power,
                connector_type,
                rate_setting,
                status,
                date_created,
                date_modified
            )
            VALUES ?
        `;

		let values = data.map((connector, index) => [
			uid,
			index + 1,
			connector.standard,
			connector.format,
			connector.power_type,
			connector.max_voltage,
			connector.max_amperage,
			connector.max_electric_power,
			connector.standard,
			connector.rate_setting + " KW-H",
			"AVAILABLE",
			new Date(),
			new Date(),
		]);

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [values], (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	GetCPODetails() {
		const QUERY = `
			SELECT * FROM cpo_owners
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	GetCPODetailsByID(cpoID) {
		const QUERY = `

			SELECT 
				party_id,
				cpo_owner_name,
				contact_name,
				contact_number,
				contact_email,
				logo,
				token_c
			FROM 
				cpo_owners
			WHERE 
				id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetCPOLogoByCPOID(cpoID) {
		const QUERY = `

			SELECT
                logo
            FROM
                cpo_owners
            WHERE
                id = ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	UpdateCPOLogoByID(cpoID, logo) {
		const QUERY = `
		
			UPDATE
				cpo_owners
            SET
			    logo =?,
				date_modified = NOW()
			WHERE
				id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [logo, cpoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetPendingLocationsAndEVSEs(cpoID) {
		const QUERY = `

			SELECT
				COUNT(DISTINCT location_name) AS pending_locations,
				COUNT(DISTINCT evse_sn) AS pending_evses
			FROM
				csv_temporary_table
			WHERE 
				cpo_owner_id =?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}
};
