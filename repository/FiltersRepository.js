const mysql = require("../database/mysql");

module.exports = class FiltersRepository {
	async GetConnectorTypes() {
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

	async GetFacilities() {
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

	async GetCapabilities() {
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

	async GetPaymentTypes() {
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

	async GetParkingTypes() {
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
};
