const fs = require("fs");
const path = require("path");

const CPORepository = require("../repository/CPORepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");
const axios = require("axios");
const Email = require("../utils/Email");
const generator = require("generate-password");

module.exports = class CPOService {
	/**
	 * @type {CPORepository}
	 */
	#repository;

	constructor(repository) {
		this.#repository = repository;
	}

	/**
	 * Registers a Charge Point Operator (CPO).
	 *
	 * @async
	 * @param {Object} data - The CPO registration data.
	 * @param {string} data.cpo_owner_name - The name of the CPO owner.
	 * @param {string} data.contact_email - The contact email of the CPO.
	 * @param {string} data.username - The username for the CPO account.
	 *
	 * @returns {Promise<string>} The status of the CPO registration.
	 *
	 * @throws {HttpBadRequest} If the registration status is not "SUCCESS" and the status type is "bad_request".
	 * @throws {Error} For any other errors that occur during the registration process.
	 */
	async RegisterCPO(data) {
		try {
			const result = await this.#repository.CheckIfCPOExistsByName(
				data.cpo_owner_name
			);

			let party_id = null;
			let token_c = null;
			let password = generator.generate({ length: 8, numbers: true });

			// if (result.length) {
			// 	party_id = result[0].party_id;
			// 	token_c = result[0].token_c;
			// } else {
			party_id = await this.GeneratePartyID(data.cpo_owner_name);
			token_c = Crypto.Encrypt(JSON.stringify({ party_id }));
			// }

			const cpoResult = await this.#repository.RegisterCPO({
				...data,
				party_id,
				token_c,
				password,
			});

			const cpoStatus = cpoResult[0][0].STATUS;
			const cpoStatusType = cpoResult[0][0].status_type;

			if (cpoStatus !== "SUCCESS" && cpoStatusType === "bad_request")
				throw new HttpBadRequest(cpoStatus, []);

			const email = new Email(data.contact_email, {
				party_id,
				token_c,
				cpo_owner_id: cpoResult[0][0].cpo_owner_id,
				username: data.username,
				temporary_password: password,
			});

			await email.SendFindEVPlugCredentials();

			return cpoStatus;
		} catch (err) {
			throw err;
		}
	}

	async RegisterLocationAndEVSEs(data) {
		/**
		 * @type {import('mysql2').PoolConnection}
		 */
		let connection = null;

		try {
			connection = await this.#repository.GetConnection();

			const evses = data.evses;
			const cpo = await this.#repository.GetCPOOwnerIDByPartyID(data.party_id);

			if (!cpo[0]) throw new HttpBadRequest("PARTY_ID_NOT_EXISTS", []);

			// Request to Google Geocoding API for the data based on the address provided.
			const geocodedAddress = await axios.get(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(
					data.address
				)}&key=${process.env.GOOGLE_GEO_API_KEY}`
			);

			/**
			 * Get the address_components object
			 *
			 * This object contains all of the details related to a address such as municipality, region, and postal code.
			 */
			const address_components =
				geocodedAddress.data.results[0]?.address_components;

			if (!address_components)
				throw new HttpBadRequest("LOCATION_NOT_FOUND", []);

			// Get the city name when the type is 'locality'
			const city = address_components.find((component) =>
				component.types.includes("locality")
			)?.long_name;

			/**
			 * Get the region name when the type is 'administrative_area_level_1'
			 *
			 * Get the first three letters of the region, convert it to uppercase, and trim it.
			 */
			const region = String(
				address_components.find((component) =>
					component.types.includes("administrative_area_level_1")
				)?.short_name
			)
				.slice(0, 3)
				.toUpperCase()
				.trim();

			/**
			 * Get the postal code of the address when the type is 'postal_code'
			 */
			const postal_code = address_components.find((component) =>
				component.types.includes("postal_code")
			)?.long_name;

			// Get the latitude, and longitude of the address
			const { lat, lng } = geocodedAddress.data.results[0].geometry.location;

			// Get the formatted address.
			const formatted_address =
				geocodedAddress.data.results[0].formatted_address;

			// Add a location
			const locationResult = await this.#repository.RegisterLocation(
				{
					cpo_owner_id: cpo[0].id,
					name: data.name,
					address: formatted_address,
					lat,
					lng,
					city,
					region,
					postal_code,
					images: JSON.stringify([]),
				},
				connection
			);

			for (const evse of evses) {
				const evseResult = await this.#repository.RegisterEVSE(
					{
						uid: evse.uid,
						serial_number: evse.uid,
						meter_type: evse.meter_type,
						location_id: locationResult.insertId,
					},
					connection
				);

				if (evseResult[0][0].status_type === "bad_request") {
					throw new HttpBadRequest(evseResult[0][0].STATUS, []);
				}

				const transformedConnectors = evse.connectors.map((connector) => ({
					...connector,
					rate_setting: evse.kwh,
				}));

				const connectorResult = await this.#repository.AddConnector(
					evse.uid,
					transformedConnectors,
					connection
				);

				console.log(connectorResult);
			}
			connection.commit();

			return { location_id: locationResult.insertId };
		} catch (err) {
			console.log(err);
			if (connection) connection.rollback();
			throw err;
		} finally {
			if (connection) connection.release();
		}
	}

	async GetCPODetailsByID(cpoID) {
		try {
			const cpoDetails = await this.#repository.GetCPODetailsByID(cpoID);

			if (!cpoDetails.length) throw new HttpBadRequest("CPO_NOT_FOUND", []);

			return cpoDetails[0];
		} catch (err) {
			throw err;
		}
	}

	async UpdateCPOLogoByID(cpoID, newLogo) {
		try {
			const logo = await this.#repository.GetCPOLogoByCPOID(cpoID);

			if (!logo.length) throw new HttpBadRequest("CPO_NOT_FOUND", []);

			if (logo[0].logo !== "default.svg") {
				const filePath = path.join("public", "images", logo[0].logo);

				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			}

			await this.#repository.UpdateCPOLogoByID(cpoID, newLogo);

			return "SUCCESS";
		} catch (err) {
			throw err;
		}
	}

	async GetPendingLocationsAndEVSEs(cpoID) {
		const result = await this.#repository.GetPendingLocationsAndEVSEs(cpoID);

		if (result[0].pending_locations === 0 && result[0].pending_evses === 0)
			return "NO_PENDING_LOCATIONS_AND_EVSES";

		return result;
	}

	async GeneratePartyID(companyName) {
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
