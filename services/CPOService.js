const CPORepository = require("../repository/CPORepository");

module.exports = class CPOService {
	#repository;

	constructor() {
		this.#repository = new CPORepository();
	}

	async RegisterCPO(data) {
		const result = await this.#repository.RegisterCPO(data);

		const status = result[0][0].STATUS;

		return status;
	}
};
