const mysql = require("../database/mysql");

module.exports = class LocationRepository {
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

	GetLocations(cpoOwnerID, limit, offset) {
		const QUERY = `
            SELECT
                *
            FROM 
                cpo_locations
            WHERE
                cpo_owner_id = ?
            LIMIT ? OFFSET ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoOwnerID, limit, offset], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetLocationsById(locationID) {
		const QUERY = `
			SELECT
				*
			FROM
				cpo_locations
			WHERE 
				id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [locationID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetEVSEs(cpoLocationID) {
		const QUERY = `
            SELECT
                *
            FROM 
                evse
            WHERE
                cpo_location_id =?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoLocationID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetEVSEsByCPOOwnerID(
		cpoOwnerID,
		locationName,
		orderBy,
		order,
		limit,
		offset
	) {
		const QUERY = `
			 SELECT
                *
            FROM 
                evse
            INNER JOIN cpo_locations ON evse.cpo_location_id = cpo_locations.id
			INNER JOIN cpo_owners ON cpo_locations.cpo_owner_id = cpo_owners.id
			WHERE cpo_owners.id = ? ${
				locationName ? `AND cpo_locations.name LIKE "%${locationName}%"` : ""
			}
			ORDER BY ${
				orderBy === "location" ? "cpo_locations.name" : "evse.date_created"
			} ${order}
			LIMIT ? OFFSET ?
		`;

		console.log(QUERY);
		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoOwnerID, limit, offset], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetEVSEsOfLocationByName(cpoOwnerID, locationName, orderBy) {
		const QUERY = `
			 SELECT
                *
            FROM 
                evse
            INNER JOIN cpo_locations ON evse.cpo_location_id = cpo_locations.id
			INNER JOIN cpo_owners ON cpo_locations.cpo_owner_id = cpo_owners.id
			WHERE cpo_owners.id = ? ${locationName && "AND cpo_locations.name = ?"}
			ORDER BY ${
				orderBy === "date_created" ? "evse.date_created" : "cpo_locations.name"
			}
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoOwnerID, locationName], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetConnectors(evseUID) {
		const QUERY = `
        
            SELECT
                *
            FROM 
                evse_connectors
            WHERE 
                evse_uid = ? 
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [evseUID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetLocationFacilities(locationID) {
		const query = `
			SELECT 
				*
			FROM 
				facilities
			WHERE id IN (
				SELECT facility_id FROM cpo_location_facilities WHERE cpo_location_id = ?
			)
		`;

		return new Promise((resolve, reject) => {
			mysql.query(query, [locationID], (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}

	GetLocationParkingRestrictions(locationID) {
		const query = `
			SELECT 
				*
			FROM 
				parking_restrictions
			WHERE id IN (
                SELECT parking_restriction_code_id FROM cpo_location_parking_restrictions WHERE cpo_location_id = ?
            )
		`;

		return new Promise((resolve, reject) => {
			mysql.query(query, [locationID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	GetLocationParkingTypes(locationID) {
		const query = `
			SELECT
				*
			FROM
				parking_types
			WHERE id IN (
                SELECT parking_type_id FROM cpo_location_parking_types WHERE cpo_location_id =?
            )
		`;

		return new Promise((resolve, reject) => {
			mysql.query(query, [locationID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	GetEVSECapabilities(evseUID) {
		const query = `
			SELECT *
			FROM capabilities
			WHERE id IN (
				SELECT capability_id FROM evse_capabilities WHERE evse_uid = ?
			)
		`;

		return new Promise((resolve, reject) => {
			mysql.query(query, evseUID, (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	GetEVSEPaymentTypes(evseUID) {
		const query = `
			SELECT *
				FROM payment_types
				WHERE id IN (
					SELECT payment_type_id FROM evse_payment_types WHERE evse_uid = ?
				)
		`;

		return new Promise((resolve, reject) => {
			mysql.query(query, [evseUID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
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

	AddLocationFacilities(facilities, connection) {
		const QUERY = `
			INSERT INTO 
				cpo_location_facilities 
				(facility_id, cpo_location_id)
			VALUES ?
		`;

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [facilities], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Adds parking types to a location with optional tags.
	 *
	 * @function AddLocationParkingTypes
	 * @param {Array<Array>} parkingTypes - An array of arrays, where each inner array contains a parking type ID, location ID, and optional tag.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation, representing the addition of parking types to the location.
	 */
	AddLocationParkingTypes(parkingTypes, connection) {
		const QUERY = `
			INSERT INTO 
				cpo_location_parking_types (parking_type_id, cpo_location_id, tag)
			VALUES ?
		`;

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [parkingTypes], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Adds parking restrictions to a location.
	 *
	 * @function AddLocationParkingRestrictions
	 * @param {Array<Array>} parkingRestrictions - An array of arrays, where each inner array contains a parking restriction code ID and a location ID to be associated.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation, representing the addition of parking restrictions to the location.
	 */
	AddLocationParkingRestrictions(parkingRestrictions, connection) {
		const QUERY = `
			INSERT INTO 
				cpo_location_parking_restrictions (parking_restriction_code_id, cpo_location_id)
			VALUES ?
		`;

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [parkingRestrictions], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Adds payment types to an Electric Vehicle Supply Equipment (EVSE).
	 *
	 * @function AddEVSEPaymentTypes
	 * @param {Array<Array<string>>} paymentTypes - The payment types to add, each represented as an array [evse_uid, payment_type_id].
	 * @param {Object} connection - The database connection object.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation.
	 */
	AddEVSEPaymentTypes(paymentTypes, connection) {
		const QUERY = `INSERT INTO evse_payment_types (evse_uid, payment_type_id)
		VALUES ?`;

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [paymentTypes], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Adds capabilities to an Electric Vehicle Supply Equipment (EVSE).
	 *
	 * @function AddEVSECapabilities
	 * @param {Array<Array<string>>} capabilities - The capabilities to add, each represented as an array [capability_id, evse_uid].
	 * @param {Object} connection - The database connection object.
	 * @returns {Promise<Object>} A promise that resolves to the result of the database insert operation.
	 */
	AddEVSECapabilities(capabilities, connection) {
		const QUERY = `INSERT INTO evse_capabilities (capability_id, evse_uid) VALUES ?`;

		return new Promise((resolve, reject) => {
			connection.query(QUERY, [capabilities], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	GetFacilities() {
		const QUERY = `

            SELECT
                id,
                code
            FROM 
                facilities
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetParkingTypes() {
		const QUERY = `
            SELECT
                id,
                code
            FROM 
                parking_types
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetParkingRestrictions() {
		const QUERY = `
            SELECT
                id,
                code
            FROM
                parking_restrictions
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetCapabilities() {
		const QUERY = `
			SELECT
				id,
				code
			FROM 	
				capabilities
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetPaymentTypes() {
		const QUERY = `
			SELECT
				id,
				code
			FROM
				payment_types
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	GetLocationPhotoByID(photoID) {
		const QUERY = `
            SELECT
                url
            FROM
                cpo_location_images
            WHERE
                id =?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [photoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	UploadLocationPhotos(photos) {
		const QUERY = `
            INSERT INTO
                cpo_location_images (location_id, url, date_created, date_modified)
            VALUES ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [photos], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}

	UpdateLocationPhotoByID(photoID, photo) {
		const QUERY = `
            UPDATE
                cpo_location_images
            SET
                url =?,
                date_modified = NOW()
            WHERE
                id =?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [photo, photoID], (err, result) => {
				if (err) reject(err);

				resolve(result);
			});
		});
	}
};
