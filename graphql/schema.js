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

const RootQuery = new GraphQLObjectType({
	name: "Query",
	fields: {
		locations: {
			type: new GraphQLList(LOCATIONS),
			args: {
				cpo_owner_id: { type: GraphQLInt },
				limit: { type: GraphQLInt },
				offset: { type: GraphQLInt },
			},
			async resolve(parent, args) {
				logger.info({
					GET_LOCATIONS_REQUEST: {
						data: {
							cpo_owner_id: args.cpo_owner_id,
							limit: args.limit,
							offset: args.offset,
						},
						message: "SUCCESS",
					},
				});

				const result = await locationRepository.GetLocations(
					args.cpo_owner_id,
					args.limit,
					args.offset
				);

				logger.info({ GET_LOCATIONS_RESPONSE: { message: "SUCCESS" } });

				return result;
			},
		},
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
});

module.exports = schema;
