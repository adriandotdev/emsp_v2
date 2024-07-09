const {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLBoolean,
	GraphQLInt,
	GraphQLList,
	GraphQLFloat,
} = require("graphql");

// Location Repository
const LocationRepository = require("../repository/LocationRepository");

// Utils
const logger = require("../config/winston");

const locationRepository = new LocationRepository();

const GraphQLTokenMiddleware = require("../middlewares/GraphQLTokenMiddleware");
const { HttpBadRequest } = require("../utils/HttpError");

const LOCATIONS = new GraphQLObjectType({
	name: "LOCATIONS",
	fields: () => ({
		id: { type: GraphQLInt },
		cpo_owner_id: { type: GraphQLInt },
		name: { type: GraphQLString },
		address: { type: GraphQLString },
		distance: { type: GraphQLFloat },
		address_lat: { type: GraphQLFloat },
		address_lng: { type: GraphQLFloat },
		city: { type: GraphQLString },
		region: { type: GraphQLString },
		postal_code: { type: GraphQLString },
		country_code: { type: GraphQLString },
		images: { type: new GraphQLList(GraphQLString) },
		publish: { type: GraphQLBoolean },
		date_created: { type: GraphQLString },
		date_modified: { type: GraphQLString },
		evses: {
			type: new GraphQLList(EVSE_WITHOUT_LOCATIONS),
			async resolve(parent, args) {
				return await locationRepository.GetEVSEs(parent.id);
			},
		},
		facilities: {
			type: new GraphQLList(FACILITY),
			async resolve(parent, args) {
				return await locationRepository.GetLocationFacilities(parent.id);
			},
		},
		parking_restrictions: {
			type: new GraphQLList(PARKING_RESTRICTION),
			async resolve(parent, args) {
				return await locationRepository.GetLocationParkingRestrictions(
					parent.id
				);
			},
		},
		parking_types: {
			type: new GraphQLList(PARKING_TYPE),
			resolve: async function (parent) {
				return await locationRepository.GetLocationParkingTypes(parent.id);
			},
		},
	}),
});

const EVSE_WITHOUT_LOCATIONS = new GraphQLObjectType({
	name: "EVSE_WITHOUT_LOCATIONS",
	fields: () => ({
		uid: { type: GraphQLString },
		evse_id: { type: GraphQLString },
		serial_number: { type: GraphQLString },
		meter_type: { type: GraphQLString },
		status: { type: GraphQLString },
		cpo_location_id: { type: GraphQLInt },
		current_ws_connection_id: { type: GraphQLString },
		server_id: { type: GraphQLString },
		date_created: { type: GraphQLString },
		connectors: {
			type: new GraphQLList(CONNECTOR),
			async resolve(parent, args) {
				return await locationRepository.GetConnectors(parent.uid);
			},
		},
		capabilities: {
			type: new GraphQLList(EVSE_CAPABILITY),
			resolve: async function (parent) {
				return await locationRepository.GetEVSECapabilities(parent.uid);
			},
		},
		payment_types: {
			type: new GraphQLList(PAYMENT_TYPE),
			resolve: async function (parent) {
				return await locationRepository.GetEVSEPaymentTypes(parent.uid);
			},
		},
	}),
});

const LOCATION_IN_EVSE = new GraphQLObjectType({
	name: "LOCATION_IN_EVSE",
	fields: () => ({
		id: { type: GraphQLInt },
		cpo_owner_id: { type: GraphQLInt },
		name: { type: GraphQLString },
		address: { type: GraphQLString },
		address_lat: { type: GraphQLFloat },
		address_lng: { type: GraphQLFloat },
		city: { type: GraphQLString },
		region: { type: GraphQLString },
		postal_code: { type: GraphQLString },
		country_code: { type: GraphQLString },
		images: { type: new GraphQLList(GraphQLString) },
		publish: { type: GraphQLBoolean },
		date_created: { type: GraphQLString },
		date_modified: { type: GraphQLString },
		facilities: {
			type: new GraphQLList(FACILITY),
			async resolve(parent, args) {
				return await locationRepository.GetLocationFacilities(parent.id);
			},
		},
		parking_restrictions: {
			type: new GraphQLList(PARKING_RESTRICTION),
			async resolve(parent, args) {
				return await locationRepository.GetLocationParkingRestrictions(
					parent.id
				);
			},
		},
		parking_types: {
			type: new GraphQLList(PARKING_TYPE),
			resolve: async function (parent) {
				return await locationRepository.GetLocationParkingTypes(parent.id);
			},
		},
	}),
});

const EVSE = new GraphQLObjectType({
	name: "EVSE",
	fields: () => ({
		uid: { type: GraphQLString },
		evse_id: { type: GraphQLString },
		serial_number: { type: GraphQLString },
		meter_type: { type: GraphQLString },
		status: { type: GraphQLString },
		cpo_location_id: { type: GraphQLInt },
		current_ws_connection_id: { type: GraphQLString },
		server_id: { type: GraphQLString },
		date_created: { type: GraphQLString },
		locations: {
			type: LOCATION_IN_EVSE,
			async resolve(parent, args) {
				const location = await locationRepository.GetLocationsById(
					parent.cpo_location_id
				);

				return location[0];
			},
		},
		connectors: {
			type: new GraphQLList(CONNECTOR),
			async resolve(parent, args) {
				return await locationRepository.GetConnectors(parent.uid);
			},
		},
		capabilities: {
			type: new GraphQLList(EVSE_CAPABILITY),
			resolve: async function (parent) {
				return await locationRepository.GetEVSECapabilities(parent.uid);
			},
		},
		payment_types: {
			type: new GraphQLList(PAYMENT_TYPE),
			resolve: async function (parent) {
				return await locationRepository.GetEVSEPaymentTypes(parent.uid);
			},
		},
	}),
});

const CONNECTOR = new GraphQLObjectType({
	name: "CONNECTOR",
	fields: () => ({
		id: { type: GraphQLInt },
		evse_uid: { type: GraphQLString },
		connector_id: { type: GraphQLInt },
		standard: { type: GraphQLString },
		format: { type: GraphQLString },
		power_type: { type: GraphQLString },
		max_voltage: { type: GraphQLInt },
		max_amperage: { type: GraphQLInt },
		max_electric_power: { type: GraphQLInt },
		connector_type: { type: GraphQLString },
		rate_setting: { type: GraphQLString },
		status: { type: GraphQLString },
		date_created: { type: GraphQLString },
		date_modified: { type: GraphQLString },
	}),
});

const FACILITY = new GraphQLObjectType({
	name: "FACILITY",
	fields: () => ({
		id: { type: GraphQLInt },
		code: { type: GraphQLString },
		description: { type: GraphQLString },
	}),
});

const PARKING_RESTRICTION = new GraphQLObjectType({
	name: "PARKING_RESTRICTION",
	fields: () => ({
		id: { type: GraphQLInt },
		code: { type: GraphQLString },
		description: { type: GraphQLString },
	}),
});

const PARKING_TYPE = new GraphQLObjectType({
	name: "PARKING_TYPE",
	fields: () => ({
		id: { type: GraphQLInt },
		code: { type: GraphQLString },
		description: { type: GraphQLString },
	}),
});

const EVSE_CAPABILITY = new GraphQLObjectType({
	name: "EVSE_CAPABILITY",
	fields: () => ({
		id: { type: GraphQLInt },
		code: { type: GraphQLString },
		description: { type: GraphQLString },
	}),
});

const PAYMENT_TYPE = new GraphQLObjectType({
	name: "PAYMENT_TYPES",
	fields: () => ({
		id: { type: GraphQLInt },
		code: { type: GraphQLString },
		description: { type: GraphQLString },
	}),
});

const tokenMiddleware = new GraphQLTokenMiddleware();

const RootQuery = new GraphQLObjectType({
	name: "Query",
	fields: {
		locations: {
			type: new GraphQLList(LOCATIONS),
			args: {
				limit: { type: GraphQLInt },
				offset: { type: GraphQLInt },
			},
			async resolve(parent, args, context) {
				logger.info({
					GET_LOCATIONS_REQUEST: {
						data: {
							limit: args.limit,
							offset: args.offset,
							context,
						},
						message: "SUCCESS",
					},
				});

				try {
					const tokenData = await tokenMiddleware.AccessTokenVerifier(
						context.auth
					);

					const result = await locationRepository.GetLocations(
						tokenData.cpo_owner_id,
						args.limit,
						args.offset
					);

					logger.info({ GET_LOCATIONS_RESPONSE: { message: "SUCCESS" } });

					return result;
				} catch (err) {
					throw err;
				}
			},
		},
		evses: {
			/**
			 * Return only the EVSE under of the logged in CPO
			 */
			type: new GraphQLList(EVSE),
			args: {
				location_name: { type: GraphQLString },
				order_by: { type: GraphQLString },
				order: { type: GraphQLString, defaultValue: "ASC" },
				limit: { type: GraphQLInt, defaultValue: 10 },
				offset: { type: GraphQLInt, defaultValue: 0 },
			},
			async resolve(parent, args, context) {
				try {
					const { location_name, order_by, order, limit, offset } = args;

					if (!["ASC", "DESC"].includes(order))
						throw new HttpBadRequest(
							"INVALID_ORDER_VALUE: Valid values are: ASC | DESC"
						);

					if (!["location", "date_created"].includes(order_by))
						throw new HttpBadRequest("INVALID_ORDER_BY_VALUE", []);

					const tokenData = await tokenMiddleware.AccessTokenVerifier(
						context.auth
					);

					const result = await locationRepository.GetEVSEsByCPOOwnerID(
						tokenData.cpo_owner_id,
						location_name,
						order_by,
						order,
						limit,
						offset
					);

					return result;
				} catch (err) {
					throw err;
				}
			},
		},

		find_ev_locations: {
			type: new GraphQLList(LOCATIONS),

			async resolve(parent, args, context) {
				try {
					await tokenMiddleware.BasicTokenVerifier(context.auth);

					const result = await locationRepository.GetFindEVLocations();

					return result;
				} catch (err) {
					throw err;
				}
			},
		},

		find_ev_filter_locations: {
			type: new GraphQLList(LOCATIONS),
			args: {
				lat: { type: GraphQLFloat },
				lng: { type: GraphQLFloat },
				facilities: { type: new GraphQLList(GraphQLString) },
				capabilities: { type: new GraphQLList(GraphQLString) },
				payment_types: { type: new GraphQLList(GraphQLString) },
				parking_types: { type: new GraphQLList(GraphQLString) },
				parking_restrictions: { type: new GraphQLList(GraphQLString) },
				connector_types: { type: new GraphQLList(GraphQLString) },
				power_types: { type: new GraphQLList(GraphQLString) },
				distance: { type: GraphQLInt },
				city: { type: GraphQLString },
			},

			async resolve(parent, args, context) {
				await tokenMiddleware.BasicTokenVerifier(context.auth);

				let facilities = "";
				let capabilities = "";
				let paymentTypes = "";
				let parkingTypes = "";
				let parkingRestrictions = "";
				let connectorTypes = "";
				let powerTypes = "";

				args.facilities?.forEach((facility) => {
					facilities += `'${facility}', `;
				});

				facilities = facilities.slice(0, facilities.length - 2);

				args.capabilities?.forEach((capability) => {
					capabilities += `'${capability}', `;
				});

				capabilities = capabilities.slice(0, capabilities.length - 2);

				args.payment_types?.forEach((paymentType) => {
					paymentTypes += `'${paymentType}', `;
				});

				paymentTypes = paymentTypes.slice(0, paymentTypes.length - 2);

				args.parking_types?.forEach((parkingType) => {
					parkingTypes += `'${parkingType}', `;
				});

				parkingTypes = parkingTypes.slice(0, parkingTypes.length - 2);

				args.parking_restrictions?.forEach((parkingRestriction) => {
					parkingRestrictions += `'${parkingRestriction}', `;
				});

				parkingRestrictions = parkingRestrictions.slice(
					0,
					parkingRestrictions.length - 2
				);

				args.connector_types?.forEach((connectorType) => {
					connectorTypes += `'${connectorType}', `;
				});

				connectorTypes = connectorTypes.slice(0, connectorTypes.length - 2);

				args.power_types?.forEach((powerType) => {
					powerTypes += `'${powerType}', `;
				});

				powerTypes = powerTypes.slice(0, powerTypes.length - 2);

				const result = await locationRepository.FilterFindEVLocations(
					{
						lat: args.lat,
						lng: args.lng,
					},
					facilities,
					capabilities,
					paymentTypes,
					parkingTypes,
					parkingRestrictions,
					connectorTypes,
					powerTypes,
					args.distance,
					args.city
				);

				return result;
			},
		},
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
});

module.exports = schema;
