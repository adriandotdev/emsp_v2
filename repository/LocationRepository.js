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
};
