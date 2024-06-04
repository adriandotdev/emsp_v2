const CPORepository = require("../repository/CPORepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");
const axios = require("axios");
const Email = require("../utils/Email");

module.exports = class CPOService {
	#repository;

	constructor() {
		this.#repository = new CPORepository();
	}

	async RegisterCPO(data) {
		try {
			const party_id = await this.#GeneratePartyID(data.cpo_owner_name);
			const token_c = Crypto.Encrypt(JSON.stringify({ party_id }));

			const cpoResult = await this.#repository.RegisterCPO({
				...data,
				party_id,
				token_c,
			});

			const cpoStatus = cpoResult[0][0].STATUS;
			const cpoStatusType = cpoResult[0][0].status_type;

			if (cpoStatus !== "SUCCESS" && cpoStatusType === "bad_request")
				throw new HttpBadRequest(cpoStatus, []);

			const email = new Email(data.contact_email, {
				party_id,
				token_c,
				cpo_owner_id: cpoResult[0][0].cpo_owner_id,
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

			const location = data.location;
			const evses = data.evses;

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
					cpo_owner_id: data.cpo_owner_id,
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

			return "SUCCESS";
		} catch (err) {
			if (connection) connection.rollback();
			throw err;
		} finally {
			if (connection) connection.release();
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
