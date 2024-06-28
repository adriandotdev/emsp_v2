const mysql = require("../database/mysql");

module.exports = class LocationRepository {
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

	GetEVSEsByCPOOwnerID(cpoOwnerID) {
		const QUERY = `
            SELECT
                *
            FROM 
                evse
            INNER JOIN cpo_locations ON evse.cpo_location_id = cpo_locations.id
			INNER JOIN cpo_owners ON cpo_locations.cpo_owner_id = cpo_owners.id
			WHERE cpo_owners.id = ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [cpoOwnerID], (err, result) => {
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
};
