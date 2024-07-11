const LocationService = require("../services/LocationService");
const CSVService = require("../services/CSVService");
const CSVRepository = require("../repository/CSVRepository");

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

// Mock repository for CSVRepository class
const mockCSVRepository = {
	GetConnection: jest.fn().mockResolvedValue(mConnection),
	GetCPOOwnerIDByPartyID: jest.fn().mockResolvedValue([{ id: 1 }]),
	SearchLocationByName: jest.fn().mockResolvedValue([{ id: 123 }]),
};

// Mock repository for LocationRepository
const mockLocationRepository = {
	GetConnection: jest.fn().mockResolvedValue(mConnection),
	GetFacilities: jest.fn().mockResolvedValue([
		{ id: 1, code: "GAS_STATION" },
		{ id: 2, code: "DRUGSTORE" },
		{ id: 3, code: "CINEMA" },
		{ id: 4, code: "CAFE" },
	]),
	GetParkingTypes: jest.fn().mockResolvedValue([
		{ id: 1, code: "OUTDOOR" },
		{ id: 2, code: "INDOOR" },
	]),
	GetParkingRestrictions: jest.fn().mockResolvedValue([
		{ id: 1, code: "CUSTOMERS" },
		{ id: 2, code: "DISABLED" },
		{ id: 3, code: "EV_ONLY" },
		{ id: 4, code: "MOTORCYCLES" },
		{ id: 5, code: "PLUGGED" },
	]),
	GetCapabilities: jest.fn().mockResolvedValue([
		{ id: 1, code: "CREDIT_DEBIT_PAYABLE" },
		{ id: 2, code: "QR_READER" },
		{ id: 3, code: "PRIVILEGE_AND_LOYALTY" },
	]),
	GetPaymentTypes: jest.fn().mockResolvedValue([
		{ id: 1, code: "MAYA" },
		{ id: 2, code: "GCASH" },
	]),
	RegisterLocation: jest
		.fn()
		.mockImplementation((data, connection) =>
			Promise.resolve({ insertId: 123 })
		),
	AddLocationFacilities: jest.fn().mockResolvedValue(undefined),
	AddLocationParkingTypes: jest.fn().mockResolvedValue(),
	AddLocationParkingRestrictions: jest.fn().mockResolvedValue(),
	RegisterEVSE: jest.fn().mockResolvedValue([[{ STATUS: "SUCCESS" }]]),
	AddConnector: jest.fn().mockResolvedValue(),
	AddEVSECapabilities: jest.fn().mockResolvedValue(),
	AddEVSEPaymentTypes: jest.fn().mockResolvedValue(),
};

describe("Location", () => {
	/**
	 * @type {LocationService}
	 */
	let locationService;
	let data;

	beforeEach(() => {
		locationService = new LocationService(
			mockCSVRepository,
			mockLocationRepository
		);
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

	it("Should register EVSEs when Location exists", async () => {
		const connection = await mockCSVRepository.GetConnection();

		const result = await locationService.RegisterLocationAndEVSEs(
			data,
			connection
		);

		expect(result).toEqual({ location_id: 123 });

		expect(mockLocationRepository.RegisterLocation).toHaveBeenCalledTimes(0);
		expect(mockLocationRepository.AddConnector).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.AddEVSECapabilities).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.AddEVSEPaymentTypes).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.RegisterEVSE).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.GetFacilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetParkingTypes).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetParkingRestrictions).toHaveBeenCalledTimes(
			1
		);
		expect(mockLocationRepository.GetCapabilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetPaymentTypes).toHaveBeenCalledTimes(1);
		expect(mockCSVRepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
		expect(mockCSVRepository.SearchLocationByName).toHaveBeenCalledTimes(1);
	});

	it("Should register Location, and EVSEs when Location does not exist", async () => {
		mockCSVRepository.SearchLocationByName = jest.fn().mockResolvedValue([]);

		const connection = await mockCSVRepository.GetConnection();

		const result = await locationService.RegisterLocationAndEVSEs(
			data,
			connection
		);

		expect(mockLocationRepository.RegisterLocation).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.AddConnector).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.AddEVSECapabilities).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.AddEVSEPaymentTypes).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.RegisterEVSE).toHaveBeenCalledTimes(2);
		expect(mockLocationRepository.GetFacilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetParkingTypes).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetParkingRestrictions).toHaveBeenCalledTimes(
			1
		);
		expect(mockLocationRepository.GetCapabilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetPaymentTypes).toHaveBeenCalledTimes(1);
		expect(mockCSVRepository.GetCPOOwnerIDByPartyID).toHaveBeenCalledTimes(1);
		expect(mockCSVRepository.SearchLocationByName).toHaveBeenCalledTimes(1);
	});

	it("Should register an EVSE", async () => {
		mockLocationRepository.RegisterEVSE = jest
			.fn()
			.mockResolvedValue([[{ STATUS: "SUCCESS" }]]);

		const result = await locationService.RegisterEVSE({
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
		});

		expect(result).toBe("SUCCESS");
		expect(mockLocationRepository.AddConnector).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.AddEVSECapabilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.AddEVSEPaymentTypes).toHaveBeenCalledTimes(1);
		expect(mConnection.commit).toHaveBeenCalledTimes(1);
		expect(mConnection.beginTransaction).toHaveBeenCalledTimes(1);
		expect(mConnection.release).toHaveBeenCalledTimes(1);
		expect(mConnection.rollback).toHaveBeenCalledTimes(0);
		expect(mockLocationRepository.GetCapabilities).toHaveBeenCalledTimes(1);
		expect(mockLocationRepository.GetPaymentTypes).toHaveBeenCalledTimes(1);
	});

	it("should return INVALID CAPABILITIES when registering EVSE and it has invalid capabilities", async () => {
		try {
			await locationService.RegisterEVSE({
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
				capabilities: ["CREDIT_DEBIT_PAYABLES", "QR_READER"],
				payment_types: ["GCASH", "MAYA"],
			});
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_CAPABILITIES");
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should return INVALID PAYMENT TYPES when registering EVSE and it has invalid payment types", async () => {
		try {
			await locationService.RegisterEVSE({
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
				payment_types: ["GCASH", "MAYAS"], // Valid values are: "GCASH" and "MAYA"
			});
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_PAYMENT_TYPES");
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should return BAD REQUEST when status is not SUCCESS - LOCATION_ID_DOES_NOT_EXISTS", async () => {
		mockLocationRepository.RegisterEVSE = jest
			.fn()
			.mockResolvedValue([
				[{ STATUS: "LOCATION_ID_DOES_NOT_EXISTS", status_type: "bad_request" }],
			]);

		const input = {
			location_id: 1,
		};

		try {
			await locationService.RegisterEVSE(input);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe(
				"LOCATION_ID_DOES_NOT_EXISTS:" + input.location_id
			);
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});

	it("should return BAD REQUEST when status is not SUCCESS - DUPLICATE_EVSE_UID", async () => {
		mockLocationRepository.RegisterEVSE = jest
			.fn()
			.mockResolvedValue([
				[{ STATUS: "DUPLICATE_EVSE_UID", status_type: "bad_request" }],
			]);

		const input = {
			uid: "123456689",
		};

		try {
			await locationService.RegisterEVSE(input);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("DUPLICATE_EVSE_UID:" + input.uid);
			expect(mConnection.commit).toHaveBeenCalledTimes(0);
			expect(mConnection.rollback).toHaveBeenCalledTimes(1);
			expect(mConnection.release).toHaveBeenCalledTimes(1);
		}
	});
});
