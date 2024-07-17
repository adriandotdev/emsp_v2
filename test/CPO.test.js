const CPOService = require("../services/CPOService");
const { generate } = require("generate-password");
const Email = require("../utils/Email");
const axios = require("axios");
const { HttpBadRequest } = require("../utils/HttpError");

const mConnection = {
	release: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
};

jest.mock("mysql2", () => {
	const mConnection = {
		release: jest.fn(),
		beginTransaction: jest.fn(),
		commit: jest.fn(),
		rollback: jest.fn(),
	};
	const mPool = {
		getConnection: jest.fn((callback) => callback(null, mConnection)),
		on: jest.fn(),
	};
	return {
		createPool: jest.fn(() => mPool),
	};
});

jest.mock("axios");
jest.mock("generate-password", () => {
	return {
		generate: jest.fn(() => "password"),
	};
});

jest.mock("../utils/Crypto.js", () => {
	return {
		Encrypt: jest.fn(),
		Decrypt: jest.fn(),
	};
});

jest.mock("../utils/Email.js", () => {
	return jest.fn().mockImplementation(() => {
		return {
			SendFindEVPlugCredentials: jest.fn(),
		};
	});
});

const mockCPORepository = {
	GetConnection: jest.fn().mockResolvedValue(mConnection),
	CheckIfCPOExistsByName: jest.fn().mockResolvedValue([]),
	RegisterCPO: jest.fn().mockResolvedValue([[{ STATUS: "SUCCESS" }]]),
	GetCPOOwnerIDByPartyID: jest.fn().mockResolvedValue([{ id: 1 }]),
	RegisterLocation: jest.fn().mockResolvedValue({ insertId: 1 }),
	RegisterEVSE: jest.fn().mockResolvedValue([[{ STATUS: "SUCCESS" }]]),
	AddConnector: jest.fn(),
	GetCPODetailsByID: jest.fn().mockResolvedValue([
		{
			party_id: "TES",
			cpo_owner_name: "CPO Owner",
			contact_name: "Contact Person",
			contact_number: "09341123312",
			contact_email: "test@gmail.com",
			logo: "test.svg",
		},
	]),
	GetCPOLogoByCPOID: jest.fn().mockResolvedValue([{ logo: "logo.svg" }]),
	UpdateCPOLogoByID: jest.fn(),
	GetCPODetails: jest.fn().mockResolvedValue([{ party_id: "PAR" }]),
};

describe("CPO Service - Unit Tests", () => {
	/**
	 * @type {CPOService}
	 */
	let service;
	let data;

	beforeEach(() => {
		service = new CPOService(mockCPORepository);

		data = {
			name: "Yan-Yan's Store",
			address: "BLK 137 LOT 3, Phase 2, Cabuyao, Laguna",
			lat: "14.12345",
			lng: "121.12345",
			evses: [
				{
					uid: "123456689",
					status: "AVAILABLE",
					meter_type: "AC",
					kwh: 7,
					connectors: [
						{
							standard: "CHADEMO",
							format: "SOCKET",
							power_type: "AC",
							max_voltage: 230,
							max_amperage: 16,
							max_electric_power: 120,
						},
					],
					capabilities: ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
					payment_types: ["GCASH", "MAYA"],
				},
				{
					uid: "123",
					status: "AVAILABLE",
					meter_type: "AC",
					kwh: 7,
					connectors: [
						{
							standard: "TYPE_2",
							format: "SOCKET",
							power_type: "AC",
							max_voltage: 230,
							max_amperage: 16,
							max_electric_power: 120,
						},
					],
					capabilities: ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
					payment_types: ["GCASH", "MAYA"],
				},
			],
			facilities: ["CINEMA", "CAFE"],
			parking_types: ["INDOOR"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		axios.get.mockResolvedValue({
			data: {
				results: [
					{
						address_components: [
							{
								long_name: "Cabuyao",
								short_name: "Cabuyao",
								types: ["locality", "political"],
							},
							{
								long_name: "Laguna",
								short_name: "Laguna",
								types: ["administrative_area_level_2", "political"],
							},
							{
								long_name: "Calabarzon",
								short_name: "Calabarzon",
								types: ["administrative_area_level_1", "political"],
							},
							{
								long_name: "Philippines",
								short_name: "PH",
								types: ["country", "political"],
							},
						],
						geometry: {
							location: { lat: 14.12345, lng: 121.12345 },
						},
					},
				],
			},
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should successfully REGISTER CHARGING POINT OPERATOR", async () => {
		CPOService.prototype.GeneratePartyID = jest
			.fn()
			.mockResolvedValueOnce("TES");

		const result = await service.RegisterCPO({
			cpo_owner_name: "Testing",
			contact_email: "contact@example.com",
			username: "testing",
		});

		expect(result).toBe("SUCCESS");
		expect(mockCPORepository.CheckIfCPOExistsByName).toHaveBeenCalledWith(
			"Testing"
		);
		expect(generate).toHaveBeenCalledTimes(1);
		expect(service.GeneratePartyID).toHaveBeenCalledTimes(1);
	});

	it("should return BAD REQUEST when status is not SUCCESS", async () => {
		CPOService.prototype.GeneratePartyID = jest
			.fn()
			.mockResolvedValueOnce("TES");

		mockCPORepository.RegisterCPO = jest
			.fn()
			.mockResolvedValue([[{ STATUS: "ERROR", status_type: "bad_request" }]]);

		try {
			await service.RegisterCPO({
				cpo_owner_name: "Testing",
				contact_email: "contact@example.com",
				username: "testing",
			});
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("ERROR");
		}
	});

	it("should REGISTER LOCATION AND EVSEs", async () => {
		const result = await service.RegisterLocationAndEVSEs(data);

		expect(mockCPORepository.GetConnection).toHaveBeenCalledTimes(1);
		expect(mockCPORepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
		expect(mockCPORepository.RegisterLocation).toHaveBeenCalledTimes(1);
		expect(mockCPORepository.RegisterLocation).toHaveBeenCalledWith(
			{
				cpo_owner_id: 1,
				name: data.name,
				address: undefined,
				lat: 14.12345,
				lng: 121.12345,
				city: "Cabuyao",
				region: "CAL",
				postal_code: undefined,
				images: JSON.stringify([]),
			},
			mConnection
		);
		expect(mockCPORepository.RegisterEVSE).toHaveBeenCalledTimes(2);
		expect(mockCPORepository.AddConnector).toHaveBeenCalledTimes(2);
		expect(mConnection.commit).toHaveBeenCalledTimes(1);
		expect(mConnection.rollback).toHaveBeenCalledTimes(0);
		expect(mConnection.release).toHaveBeenCalledTimes(1);
		expect(result).toBeTruthy();
	});

	it("should return BAD REQUEST when PARTY ID DOES NOT EXISTS", async () => {
		mockCPORepository.GetCPOOwnerIDByPartyID.mockResolvedValue([]);

		try {
			await service.RegisterLocationAndEVSEs(data);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("PARTY_ID_NOT_EXISTS");
			expect(mockCPORepository.GetConnection).toHaveBeenCalledTimes(1);
			expect(mockCPORepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should return BAD REQUEST when LOCATION NOT FOUND", async () => {
		try {
			mockCPORepository.GetCPOOwnerIDByPartyID.mockResolvedValue([{ id: 1 }]);
			axios.get.mockResolvedValueOnce({
				data: {
					results: [],
				},
			});
			await service.RegisterLocationAndEVSEs(data);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("LOCATION_NOT_FOUND");
			expect(mockCPORepository.GetConnection).toHaveBeenCalledTimes(1);
			expect(mockCPORepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should throw BAD_REQUEST when DUPLICATE_EVSE_UID error is thrown when adding EVSE", async () => {
		mockCPORepository.GetCPOOwnerIDByPartyID.mockResolvedValue([{ id: 1 }]);
		mockCPORepository.RegisterEVSE.mockResolvedValue([
			[{ STATUS: "DUPLICATE_EVSE_UID", status_type: "bad_request" }],
		]);

		try {
			await service.RegisterLocationAndEVSEs(data);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("DUPLICATE_EVSE_UID");
			expect(mockCPORepository.GetConnection).toHaveBeenCalledTimes(1);
			expect(mockCPORepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should successfully retrieve CPO Details", async () => {
		const result = await service.GetCPODetailsByID(1);

		expect(result).toEqual({
			party_id: "TES",
			cpo_owner_name: "CPO Owner",
			contact_name: "Contact Person",
			contact_number: "09341123312",
			contact_email: "test@gmail.com",
			logo: "test.svg",
		});
	});

	it("should throw BAD REQUEST when CPO is not found", async () => {
		mockCPORepository.GetCPODetailsByID.mockResolvedValue([]);

		try {
			await service.GetCPODetailsByID(1);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("CPO_NOT_FOUND");
			expect(mockCPORepository.GetCPODetailsByID).toHaveBeenCalledTimes(1);
		}
	});

	it("should successfully UPDATE CPO LOGO BY ID", async () => {
		const result = await service.UpdateCPOLogoByID(1, "new_logo.svg");

		expect(result).toBe("SUCCESS");
	});

	it("should delete cpo logo when it is not equal to default.svg", async () => {
		mockCPORepository.GetCPOLogoByCPOID.mockResolvedValue([
			{ logo: "default.svg" },
		]);

		const result = await service.UpdateCPOLogoByID(1, "new_logo.svg");

		expect(result).toBe("SUCCESS");
	});

	it("should throw BAD REQUEST when CPO NOT FOUND", async () => {
		mockCPORepository.GetCPOLogoByCPOID.mockResolvedValue([]);

		try {
			await service.UpdateCPOLogoByID(1, "new_logo.svg");
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("CPO_NOT_FOUND");
			expect(mockCPORepository.UpdateCPOLogoByID).toHaveBeenCalledTimes(0);
		}
	});
});
