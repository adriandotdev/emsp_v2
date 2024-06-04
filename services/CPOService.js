const CPORepository = require("../repository/CPORepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");

module.exports = class CPOService {
	#repository;

	constructor() {
		this.#repository = new CPORepository();
	}

	async RegisterCPO(data) {
		try {
			const party_id = await this.#GeneratePartyID(data.cpo_owner_name);

			const token_c = Crypto.Encrypt(JSON.stringify({ party_id }));

			const result = await this.#repository.RegisterCPO({
				...data,
				party_id,
			});

			const status = result[0][0].STATUS;
			const status_type = result[0][0].status_type;

			if (status !== "SUCCESS" && status_type === "bad_request")
				throw new HttpBadRequest(status, []);

			return status;
		} catch (err) {
			throw err;
		}
	}

	async #GeneratePartyID(companyName) {
		/**
		 * @Steps
		 *
		 * 1. Get all of the generated party ids first from the db.
		 *
		 * 2. Remove the spaces from company name.
		 *
		 * 3. Generate EVSE ID */

		const partyIDs = await this.#repository.GetCPODetails();

		const companyNameWithoutSpaces = String(companyName)
			.replace(/\s+/g, "")
			.trim()
			.toUpperCase(); // Trim and remove spaces.

		let partyID = companyNameWithoutSpaces.slice(0, 2);

		/** For the mean time, generation of this party_id is for the third (3rd) letter. */
		for (let i = 2; i < companyNameWithoutSpaces.length; i++) {
			// Check if party id already exists
			const isFound = partyIDs.some(
				(data) => data.party_id === partyID + companyNameWithoutSpaces[i]
			);

			if (!isFound) {
				partyID += companyNameWithoutSpaces[i];
				break;
			}
		}

		return partyID.toUpperCase(); // Return the party id. it must be uppercase.
	}
};
