const LocationService = require("../services/LocationService");
const CSVService = require("../services/CSVService");
const CSVRepository = require("../repository/CSVRepository");

const axios = require("axios");
const {
	HttpBadRequest,
	HttpInternalServerError,
} = require("../utils/HttpError");
const logger = require("../config/winston");

const mConnection = {
	release: jest.fn(),
	beginTransaction: jest.fn(),
	commit: jest.fn(),
	rollback: jest.fn(),
};

jest.mock("../config/winston.js");
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
	UploadLocationPhotos: jest.fn((photos, locationID) =>
		jest.fn().mockResolvedValue("SUCCESS")
	),
	UpdateLocationPhotoByID: jest.fn((photoID, photo) =>
		jest.fn().mockResolvedValue("SUCCESS")
	),
	GetLocationPhotoByID: jest.fn().mockResolvedValue([{ url: "filename.png" }]),
};

describe("Location Service - Unit Tests", () => {
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

	it("Should successfully register all locations and evses - RegisterAllLocationsAndEVSEs method", async () => {
		const result = await locationService.RegisterAllLocationsAndEVSEs("TES", [
			data,
		]);

		expect(result).toEqual([{ location_id: 123 }]);
		expect(mConnection.commit).toHaveBeenCalled();
		expect(mConnection.commit).toHaveBeenCalledTimes(1);
		expect(mConnection.rollback).not.toHaveBeenCalled();
		expect(mConnection.rollback).toHaveBeenCalledTimes(0);
		expect(mConnection.release).toHaveBeenCalled();
		expect(mConnection.release).toHaveBeenCalledTimes(1);
		expect(logger.error).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledTimes(0);
	});

	it("Should throw INTERNAL SERVER ERROR when thrown an error - RegisterAllLocationsAndEVSEs", async () => {
		locationService.RegisterLocationAndEVSEs = jest
			.fn()
			.mockRejectedValue(new Error("Error"));

		try {
			await locationService.RegisterAllLocationsAndEVSEs("TES", [data]);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpInternalServerError);
			expect(err.message).toBe("CSV_CANNOT_BE_PROCESSED");
		}
	});

	it("Should register EVSEs when LOCATION exists - RegisterLocationAndEVSEs", async () => {
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

	it("Should register LOCATION and EVSEs when LOCATION does not exists - RegisterLocationAndEVSEs", async () => {
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

	it("Should throw BAD REQUEST when address_components is empty - RegisterLocationAndEVSEs", async () => {
		mockCSVRepository.SearchLocationByName = jest.fn().mockResolvedValue([]);

		const connection = await mockCSVRepository.GetConnection();

		axios.get.mockResolvedValueOnce({ data: { results: [] } });

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("LOCATION_NOT_FOUND");
		}
	});

	it("Should throw BAD REQUEST when there's invalid LOCATION facilities - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

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
			facilities: ["CINEMA", "CAFEs"],
			parking_types: ["INDOOR"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_FACILITIES");
		}
	});

	it("Should throw BAD REQUEST when there's invalid LOCATION parking types - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

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
			parking_types: ["INDOORS"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_PARKING_TYPES");
		}
	});

	it("Should throw BAD REQUEST when there's invalid LOCATION parking restrictions - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

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
			parking_restrictions: ["CUSTOMERSS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_PARKING_RESTRICTIONS");
		}
	});

	it("Should throw BAD REQUEST when there's DUPLICATE evse uid - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

		mockLocationRepository.RegisterEVSE.mockResolvedValueOnce([
			[{ STATUS: "DUPLICATE_EVSE_UID", status_type: "bad_request" }],
		]);

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
			],
			facilities: ["CINEMA", "CAFE"],
			parking_types: ["INDOOR"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("DUPLICATE_EVSE_UID:123456689");
		}
	});

	it("Should throw BAD REQUEST when there's invalid EVSE capabilities - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

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
					capabilities: ["CREDIT_DEBIT_PAYABLES", "QR_READER"],
					payment_types: ["GCASH", "MAYA"],
				},
			],
			facilities: ["CINEMA", "CAFE"],
			parking_types: ["INDOOR"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_CAPABILITIES");
		}
	});

	it("Should throw BAD REQUEST when there's invalid EVSE payment types - RegisterLocationAndEVSEs", async () => {
		const connection = await mockCSVRepository.GetConnection();

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
					payment_types: ["GCASH", "MAYAS"],
				},
			],
			facilities: ["CINEMA", "CAFE"],
			parking_types: ["INDOOR"],
			parking_restrictions: ["CUSTOMERS", "DISABLED"],
		};

		try {
			await locationService.RegisterLocationAndEVSEs(data, connection);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("INVALID_PAYMENT_TYPES");
		}
	});

	it("Should successfully register an EVSE - RegisterEVSE", async () => {
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

	it("Should throw BAD REQUEST when there's invalid EVSE capabilities - RegisterEVSE", async () => {
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

	it("Should throw BAD REQUEST when there's invalid EVSE payment types - RegisterEVSE", async () => {
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

	it("Should throw BAD REQUEST when LOCATION_ID_DOES_NOT_EXISTS status received - RegisterEVSE", async () => {
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

	it("Should throw BAD REQUEST when DUPLICATE_EVSE_UID status received - RegisterEVSE", async () => {
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

	it("Should successfully upload LOCATION photos - UploadLocationPhotos", async () => {
		const result = await locationService.UploadLocationPhotos(
			[{ filename: "filename1.png" }],
			1
		);

		expect(result).toBe("SUCCESS");
	});

	it("Should throw BAD REQUEST when photos does not have any element - UploadLocationPhotos", async () => {
		try {
			await locationService.UploadLocationPhotos([], 1);
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("Please provide at least one photo");
			expect(mockLocationRepository.UploadLocationPhotos).toHaveBeenCalledTimes(
				0
			);
		}
	});

	it("Should successfully update location photo by id - UpdateLocationPhotoByID", async () => {
		const result = await locationService.UpdateLocationPhotoByID(
			1,
			"new_photo.png"
		);

		expect(result).toBe("SUCCESS");
		expect(
			mockLocationRepository.UpdateLocationPhotoByID
		).toHaveBeenCalledTimes(1);
	});

	it("Should throw BAD REQUEST when LOCATION_PHOTO_NOT_EXISTS status received - UpdateLocationPhotoByID", async () => {
		mockLocationRepository.GetLocationPhotoByID = jest
			.fn()
			.mockResolvedValue([]);

		try {
			await locationService.UpdateLocationPhotoByID(1, "new_photo.png");
		} catch (err) {
			expect(err).toBeInstanceOf(HttpBadRequest);
			expect(err.message).toBe("LOCATION_PHOTO_NOT_EXISTS");
			expect(mockLocationRepository.GetLocationPhotoByID).toHaveBeenCalledTimes(
				1
			);
			expect(
				mockLocationRepository.UpdateLocationPhotoByID
			).toHaveBeenCalledTimes(0);
		}
	});
});
