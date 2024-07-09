const FiltersRepository = require("../repository/FiltersRepository");

module.exports = class FiltersService {
	#repository;
	constructor() {
		this.#repository = new FiltersRepository();
	}

	async GetFilters() {
		const connector_types = await this.#repository.GetConnectorTypes();
		const facilities = await this.#repository.GetFacilities();
		const capabilities = await this.#repository.GetCapabilities();
		const payment_types = await this.#repository.GetPaymentTypes();
		const parking_types = await this.#repository.GetParkingTypes();
		const provinces = await this.#repository.GetProvinces();
		const cities = await this.#repository.GetCities();

		return {
			connector_types,
			facilities,
			capabilities,
			payment_types,
			parking_types,
			provinces,
			cities,
		};
	}

	async GetCitiesByProvince(province) {
		return await this.#repository.GetCitiesByProvince(province);
	}
};
