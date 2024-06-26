const path = require("path");
const fs = require("fs");
const { parse } = require("csv");

const CSVRepository = require("../repository/CSVRepository");

module.exports = class CSVService {
	/**
	 * @type {CSVRepository}
	 */
	#repository;

	constructor(repository) {
		this.#repository = repository;
	}

	ReadCSVFile(filename) {
		return new Promise((resolve, reject) => {
			const filePath = path.join("public", "csv", filename);
			const data = [];

			fs.createReadStream(filePath)
				.pipe(parse({ delimiter: ",", from_line: 2 }))
				.on("data", (row) => {
					data.push(row);
				})
				.on("end", () => {
					fs.unlinkSync(filePath);

					const result = [];

					// Helper function to find an evse by uid
					const findEvseByUid = (evses, uid) =>
						evses.find((evse) => evse.uid === uid);

					// Process the data
					data.forEach((entry) => {
						const [
							location,
							address,
							lat,
							lng,
							stationId,
							status,
							meterType,
							kwh,
							standard,
							format,
							powerType,
							maxVoltage,
							maxAmperage,
							maxElectricPower,
							facilities,
							parking_types,
							parking_restrictions,
							capabilities,
							payment_types,
						] = entry;

						// Find or create the location object
						let locationObj = result.find(
							(loc) => loc.name === location && loc.address === address
						);
						if (!locationObj) {
							locationObj = {
								name: location,
								address: address,
								lat,
								lng,
								evses: [],
								facilities: facilities
									? JSON.parse(facilities.slice(1, -1))
									: [],
								parking_types: parking_types
									? JSON.parse(parking_types.slice(1, -1))
									: [],
								parking_restrictions: parking_restrictions
									? JSON.parse(parking_restrictions.slice(1, -1))
									: [],
							};
							result.push(locationObj);
						}

						// Find or create the evse object
						let evseObj = findEvseByUid(locationObj.evses, stationId);

						if (!evseObj) {
							evseObj = {
								uid: stationId,
								status: status,
								meter_type: meterType,
								kwh: parseFloat(kwh),
								connectors: [],
								capabilities: capabilities
									? JSON.parse(capabilities.slice(1, -1))
									: [],
								payment_types: payment_types
									? JSON.parse(payment_types.slice(1, -1))
									: [],
							};
							locationObj.evses.push(evseObj);
						}

						// Add the connector
						evseObj.connectors.push({
							standard: standard,
							format: format,
							power_type: powerType,
							max_voltage: parseFloat(maxVoltage),
							max_amperage: parseFloat(maxAmperage),
							max_electric_power: parseFloat(maxElectricPower),
						});
					});

					resolve(result);
				})
				.on("error", (err) => {
					reject(err);
				});
		});
	}
};
