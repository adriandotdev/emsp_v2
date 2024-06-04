const mysql = require("../database/mysql");

module.exports = class CPORepository {
	RegisterCPO(data) {
		const QUERY = `
            CALL EMSP_REGISTER_CPO(?,?,?,?,?,?,?)
        `;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[
					data.username,
					data.party_id,
					data.cpo_owner_name,
					data.contact_name,
					data.contact_number,
					data.contact_email,
					data.ocpp_ready,
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
};
