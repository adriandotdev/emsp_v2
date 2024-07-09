const mysql = require("../database/mysql");

module.exports = class FiltersRepository {
	GetConnectorTypes() {
		const QUERY = `
        
            SELECT 
                *
            FROM 
                connector_types
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

	GetFacilities() {
		const QUERY = `

            SELECT 
                * 
            FROM    
                facilities
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

	GetCapabilities() {
		const QUERY = `
            SELECT
                *
            FROM
                capabilities
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

	GetPaymentTypes() {
		const QUERY = `
            SELECT
                *
            FROM
                payment_types
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

	GetParkingTypes() {
		const QUERY = `
            SELECT
                *
            FROM
                parking_types
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

	GetProvinces() {
		const QUERY = `
			SELECT DISTINCT 
				province,
				COUNT(*) AS total_locations
			FROM
				cpo_locations
			GROUP BY 
				province;
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

	GetCities() {
		const QUERY = `

			SELECT DISTINCT
				city
			FROM
				cpo_locations
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
	GetCitiesByProvince(province) {
		const QUERY = `
			SELECT DISTINCT
				city
			FROM
				cpo_locations
			WHERE
				province = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [province], (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}
};
