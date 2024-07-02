const {
	HttpBadRequest,
	HttpInternalServerError,
} = require("../utils/HttpError");

const CSVRepository = require("../repository/CSVRepository");
const LocationRepository = require("../repository/LocationRepository");

const logger = require("../config/winston");

const axios = require("axios");
module.exports = class LocationService {
	/**
	 * @type {CSVRepository}
	 */
	#csvRepository;

	/**
	 * @type {LocationRepository}
	 */
	#locationRepository;

	constructor(csvRepository, locationRepository) {
		this.#csvRepository = csvRepository;
		this.#locationRepository = locationRepository;
	}

	async RegisterAllLocationsAndEVSEs(party_id, locations) {
		let connection = null;

		try {
			connection = await this.#csvRepository.GetConnection();
			connection.beginTransaction();

			const promises = locations.map(async (location) => {
				try {
					return await this.RegisterLocationAndEVSEs(
						{ party_id, ...location },
						connection
					);
				} catch (error) {
					return error;
				}
			});

			const results = await Promise.all(promises);

			const errors = results.filter((result) => result instanceof Error);

			if (errors.length > 0) {
				logger.error({
					message: "One or more operations failed. Transaction rolled back",
					errors: errors.map((err) => err.message), // Log error messages
				});
				connection.rollback();
				throw new HttpInternalServerError(
					"CSV_CANNOT_BE_PROCESSED",
					errors.map((err) => err.message).join(", ")
				);
			} else {
				logger.info({ message: "TRANSACTION COMMITED" });
				connection.commit();
			}

			return results;
		} catch (error) {
			console.log(error);
			if (connection) {
				logger.info({ message: "TRANSACTION ROLLBACK" });
				connection.rollback();
			}
			throw error;
		} finally {
			if (connection) {
				logger.info({ message: "CONNECTION RELEASED" });
				connection.release();
			}
		}
	}

	RegisterLocationAndEVSEs(data, connection) {
		return new Promise(async (resolve, reject) => {
			try {
				const facilities = await this.#locationRepository.GetFacilities();
				const parking_types = await this.#locationRepository.GetParkingTypes();
				const parking_restrictions =
					await this.#locationRepository.GetParkingRestrictions();
				const capabilities = await this.#locationRepository.GetCapabilities();
				const payment_types = await this.#locationRepository.GetPaymentTypes();

				const evses = data.evses;
				const cpo = await this.#csvRepository.GetCPOOwnerIDByPartyID(
					data.party_id
				);

				let locationResult;

				// Check if party id exists
				if (!cpo[0]) throw new HttpBadRequest("PARTY_ID_DOES_NOT_EXISTS", []);

				// Retrieve data of location by name
				const isExisting = await this.#csvRepository.SearchLocationByName(
					data.name
				);

				// Check if location name exists. If location exists, skip the insertion part of location.
				if (!isExisting.length) {
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
					const { lat, lng } =
						geocodedAddress.data.results[0].geometry.location;

					// Get the formatted address.
					const formatted_address =
						geocodedAddress.data.results[0].formatted_address;

					// Add a location
					locationResult = await this.#locationRepository.RegisterLocation(
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

					let cpoFacilities;
					let cpoParkingTypes;
					let cpoParkingRestrictions;

					// Data mapping of Location's facilities
					cpoFacilities = data.facilities.map((facility) => {
						const index = facilities.findIndex((f) => f.code === facility);

						if (index === -1)
							throw new HttpBadRequest("INVALID_FACILITIES", []);

						return [facilities[index].id, locationResult.insertId];
					});

					// Data mapping of Location's parking_types
					cpoParkingTypes = data.parking_types.map((parkingType) => {
						const index = parking_types.findIndex(
							(f) => f.code === parkingType
						);

						if (index === -1)
							throw new HttpBadRequest("INVALID_PARKING_TYPES", []);

						return [
							parking_types[index].id,
							locationResult.insertId,
							parkingType,
						];
					});

					// Data mapping of Location's parking_restrictions
					cpoParkingRestrictions = data.parking_restrictions.map(
						(parkingRestriction) => {
							const index = parking_restrictions.findIndex(
								(f) => f.code === parkingRestriction
							);
							if (index === -1)
								throw new HttpBadRequest("INVALID_PARKING_RESTRICTIONS", []);
							return [parking_restrictions[index].id, locationResult.insertId];
						}
					);

					// Insertion of location's facilities
					await this.#locationRepository.AddLocationFacilities(
						cpoFacilities,
						connection
					);

					// Insertion of location's parking_types
					await this.#locationRepository.AddLocationParkingTypes(
						cpoParkingTypes,
						connection
					);

					// Insertion of location's parking_restrictions
					await this.#locationRepository.AddLocationParkingRestrictions(
						cpoParkingRestrictions,
						connection
					);
				} else {
					locationResult = { insertId: isExisting[0].id };
				}

				// Add EVSEs to the location
				for (const evse of evses) {
					const evseResult = await this.#locationRepository.RegisterEVSE(
						{
							uid: evse.uid,
							serial_number: evse.uid,
							meter_type: evse.meter_type,
							location_id: locationResult.insertId,
						},
						connection
					);

					if (evseResult[0][0].status_type === "bad_request") {
						throw new HttpBadRequest(
							evseResult[0][0].STATUS + ":" + evse.uid,
							[]
						);
					}

					const transformedConnectors = evse.connectors.map((connector) => ({
						...connector,
						rate_setting: evse.kwh,
					}));

					const evseCapabilities = evse.capabilities.map((capability) => {
						const index = capabilities.findIndex((f) => f.code === capability);
						if (index === -1)
							throw new HttpBadRequest("INVALID_CAPABILITIES", []);
						return [capabilities[index].id, evse.uid];
					});

					const evsePaymentTypes = evse.payment_types.map((paymentType) => {
						const index = payment_types.findIndex(
							(f) => f.code === paymentType
						);
						if (index === -1)
							throw new HttpBadRequest("INVALID_PAYMENT_TYPES", []);
						return [evse.uid, payment_types[index].id];
					});

					await this.#locationRepository.AddConnector(
						evse.uid,
						transformedConnectors,
						connection
					);

					await this.#locationRepository.AddEVSECapabilities(
						evseCapabilities,
						connection
					);

					await this.#locationRepository.AddEVSEPaymentTypes(
						evsePaymentTypes,
						connection
					);
				}

				logger.info({ message: "RESOLVED" });
				resolve({ location_id: locationResult.insertId });
			} catch (err) {
				logger.info({ message: "REJECTED" });
				reject(err);
			}
		});
	}
};
