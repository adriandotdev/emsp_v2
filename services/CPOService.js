const CPORepository = require("../repository/CPORepository");
const { HttpBadRequest } = require("../utils/HttpError");

module.exports = class CPOService {
	#repository;

	constructor() {
		this.#repository = new CPORepository();
	}

	async RegisterCPO(data) {
		try {
			const result = await this.#repository.RegisterCPO(data);

			const status = result[0][0].STATUS;
			const status_type = result[0][0].status_type;

			if (status !== "SUCCESS" && status_type === "bad_request")
				throw new HttpBadRequest(status, []);

			return status;
		} catch (err) {
			throw err;
		}
	}
};
