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

const LOCATIONS = new GraphQLObjectType({
	name: "LOCATIONS",
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
		evses: {
			type: new GraphQLList(EVSE),
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
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
});

module.exports = schema;
