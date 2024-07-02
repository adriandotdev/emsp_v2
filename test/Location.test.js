const LocationService = require("../services/LocationService");
const CSVService = require("../services/CSVService");
const CSVRepository = require("../repository/CSVRepository");

const axios = require("axios");

jest.mock("mysql2", () => {
	const mConnection = {
		release: jest.fn(),
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

const mockCSVRepository = {
	GetConnection: jest.fn(),
	GetCPOOwnerIDByPartyID: jest.fn().mockResolvedValue([{ id: 1 }]),
	SearchLocationByName: jest.fn().mockResolvedValue([{ id: 123 }]),
};

const mockLocationRepository = {
	GetFacilities: jest.fn().mockResolvedValue([
		{ id: 1, code: "GAS_STATION" },
		{ id: 2, code: "DRUGSTORE" },
	]),
	GetParkingTypes: jest.fn().mockResolvedValue([{ id: 1, code: "OUTDOOR" }]),
	GetParkingRestrictions: jest
		.fn()
		.mockResolvedValue([{ id: 1, code: "MOTORCYCLES" }]),
	GetCapabilities: jest.fn().mockResolvedValue([
		{ id: 1, code: "CREDIT_DEBIT_PAYABLE" },
		{ id: 2, code: "QR_READER" },
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

	beforeEach(() => {
		locationService = new LocationService(
			mockCSVRepository,
			mockLocationRepository
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should register all locations", async () => {
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
					},
				],
			},
		});

		const data = {
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

		const connection = await mockCSVRepository.GetConnection();

		const result = await locationService.RegisterLocationAndEVSEs(
			data,
			connection
		);

		expect(result).toEqual({ location_id: 123 });

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
});
