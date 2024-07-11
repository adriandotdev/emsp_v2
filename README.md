# EMSP Version 2.0 APIs

## REST APIs

### `POST Register Charging Point Operator - /ocpi/cpo/2.2/register`

**Authorization: Basic TOKEN**

**Request Body**

```json
{
	"username": "solarius", // required
	"cpo_owner_name": "Solarius", // required
	"contact_name": "Solarius CEO", // required
	"contact_number": "09123456782", // required
	"contact_email": "solarius@gmail.com", // required
	"ocpp_ready": true, // required
	"logo": "cpo-logo.png" // optional
}
```

**Response**

```json
{
	"status": 200,
	"data": "SUCCESS",
	"message": "Success"
}
```

**Errors**

- HttpBadRequest
- HttpInternalServerError

---

### `POST Upload CPO Logo - /ocpi/cpo/2.2/cpo/upload`

**Authorization: Basic TOKEN**

**Request Form Data**

- Key: cpo_logo
- Type: File

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

---

### `POST Login API - /ocpi/cpo/api/auth/v1/login`

**Authorization: Basic TOKEN**

**Request Body**

```json
{
	"username": "username",
	"password": "password"
}
```

**Response**

```json
{
	"status": 200,
	"data": {
		"access_token": "access_token",
		"access_expires_in": 1719814489,
		"refresh_token": "refresh_token",
		"refresh_expires_in": 1722405589,
		"role": "CPO_OWNER"
	},
	"message": "SUCCESS"
}
```

**Errors**

- Unauthorized
- Bad Request
- Internal Server Error

---

### `POST Upload Location Photos - /ocpi/cpo/api/v1/locations/photos/uploads`

**Authorization: Bearer TOKEN**

**Request Body**

- location_photos -> Location photos to upload. This API only accepts maximum of five (5) files.

- location_id -> Location ID

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

---

### `PATCH Update Location Photo by ID - /ocpi/cpo/api/v1/locations/photos/uploads/:photo_id`

**Authorization: Bearer TOKEN**

**Request Body**

- location_photo -> Location photo to upload as an update to the photo specified by ID

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

---

### `GET Refresh Token API - /ocpi/cpo/api/auth/v1/refresh`

**Authorization: Bearer REFRESH_TOKEN**

**Response**

```json
{
	"status": 200,
	"data": {
		"access_token": "access_token",
		"access_expires_in": 1719814489,
		"refresh_token": "refresh_token",
		"refresh_expires_in": 1722405589,
		"role": "CPO_OWNER"
	},
	"message": "SUCCESS"
}
```

**Errors**

- Forbidden
- Unauthorized
- Internal Server Error

---

### `POST Logout API - /ocpi/cpo/api/auth/v1/logout`

**Authorization: Bearer ACCESS_TOKEN**

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Logged out successfully"
}
```

**Errors**

- Unauthorized
- Internal Server Error

---

### `POST Register Locations through CSV - /ocpi/cpo/api/v2/locations/uploads/csv`

**Authorization: Bearer ACCESS_TOKEN**

**Request Body (Form Data)**

Key: file
Valid File: .csv

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

---

### `GET Default Filters - /ocpi/cpo/2.2/filters`

**Authorization: Basic BASIC_TOKEN**

**Response**

```json
{
	"status": 200,
	"data": {
		"connector_types": [
			{
				"id": 1,
				"code": "TYPE_1",
				"description": "Type 1"
			},
			{
				"id": 2,
				"code": "TYPE_2",
				"description": "Type 2"
			},
			{
				"id": 3,
				"code": "CHADEMO",
				"description": "CHADEMO"
			},
			{
				"id": 4,
				"code": "GBT",
				"description": "GBT"
			}
		]
		// Other default filters
	},
	"message": "Success"
}
```

---

### `GET List of Cities by Province - /ocpi/cpo/2.2/filters/cities/:province_name`

**Authorization: Basic BASIC_TOKEN**

**Parameters**

- `province_name`
  - Example: 'Zambales'

**Response**

```json
{
	"status": 200,
	"data": [
		{
			"city": "Olongapo"
		}
	],
	"message": "Success"
}
```

---

### `GET Charging Point Operator (CPO) Details - /ocpi/cpo/2.2/details`

**Authorization: Bearer TOKEN**

**Response**

```json
{
	"status": 200,
	"data": {
		"party_id": "EVCompany",
		"cpo_owner_name": "EVC",
		"contact_name": "Contact Name",
		"contact_number": "09341123312",
		"contact_email": "email@gmail.com",
		"logo": "logo.png"
	},
	"message": "Success"
}
```

---

### `PATCH Update CPO Logo by CPO Owner ID - /ocpi/cpo/2.2/cpo/logo/upload`

**Authorization: Bearer TOKEN**

**Request Body**

```json
{
	"logo": "filename.png"
}
```

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

---

---

## GraphQL APIs

## Query EVSEs

```graphql
query Evse {
	evse(location_name: "Fi", order_by: "location", order: "DESC") {
		uid
		evse_id
		serial_number
		meter_type
		status
		cpo_location_id
		current_ws_connection_id
		server_id
		date_created
		capabilities {
			id
			code
			description
		}
		payment_types {
			id
			code
			description
		}
		connectors {
			id
			evse_uid
			connector_id
			standard
			format
			power_type
			max_voltage
			max_amperage
			max_electric_power
			connector_type
			rate_setting
			status
			date_created
			date_modified
		}
		locations {
			id
			cpo_owner_id
			name
			address
			address_lat
			address_lng
			city
			region
			postal_code
			country_code
			images
			publish
			date_created
			date_modified
			facilities {
				id
				code
				description
			}
			parking_restrictions {
				id
				code
				description
			}
			parking_types {
				id
				code
				description
			}
		}
	}
}
```

**Authorization: Bearer TOKEN**

**Arguments**

- location_name -> Location Name (Optional)
- order_by -> Field to sort. Valid values are 'location', and 'date_created'
- order -> Sorting order. Valid values are ASC, and DESC
- limit -> Number of EVSEs to return
- offset -> Starting EVSE to return

**Response**

- List of EVSEs

---

## Query Locations

```graphql
query Locations {
	locations(limit: 10, offset: 0) {
		id
		cpo_owner_id
		name
		address
		address_lat
		address_lng
		city
		region
		postal_code
		country_code
		images
		publish
		date_created
		date_modified
		evses {
			uid
			evse_id
			serial_number
			meter_type
			status
			cpo_location_id
			current_ws_connection_id
			server_id
			date_created
			connectors {
				id
				evse_uid
				connector_id
				standard
				format
				power_type
				max_voltage
				max_amperage
				max_electric_power
				connector_type
				rate_setting
				status
				date_created
				date_modified
			}
			capabilities {
				id
				code
				description
			}
			payment_types {
				id
				code
				description
			}
		}
		facilities {
			id
			code
			description
		}
		parking_restrictions {
			id
			code
			description
		}
		parking_types {
			id
			code
			description
		}
	}
}
```

**Authorization: Bearer TOKEN**

**Arguments**

- limit -> Number of Locations to return
- offset -> Starting Location to return

**Response**

- List of Locations

---

### Query FindEV Locations

```graphql
query Find_ev_locations {
	find_ev_locations {
		id
		cpo_owner_id
		name
		address
		address_lat
		address_lng
		distance
		city
		region
		postal_code
		country_code
		images
		publish
		date_created
		date_modified
		evses {
			uid
			evse_id
			serial_number
			meter_type
			status
			cpo_location_id
			current_ws_connection_id
			server_id
			date_created
			capabilities {
				id
				code
				description
			}
			payment_types {
				id
				code
				description
			}
			connectors {
				id
				evse_uid
				connector_id
				standard
				format
				power_type
				max_voltage
				max_amperage
				max_electric_power
				connector_type
				rate_setting
				status
				date_created
				date_modified
			}
		}
		facilities {
			id
			code
			description
		}
		parking_restrictions {
			id
			code
			description
		}
		parking_types {
			id
			code
			description
		}
	}
}
```

**Authorization: Basic BASIC_TOKEN**

**Response**

- List of FindEV Locations

---

### Query FindEV Filter Locations

```graphql
query Find_ev_filter_locations {
	find_ev_filter_locations(lat: 14.559192, lng: 121.017516) {
		id
		cpo_owner_id
		name
		address
		distance
		address_lat
		address_lng
		city
		province
		region
		postal_code
		country_code
		images
		publish
		date_created
		date_modified
		evses {
			uid
			evse_id
			serial_number
			meter_type
			status
			cpo_location_id
			current_ws_connection_id
			server_id
			date_created
			connectors {
				id
				evse_uid
				connector_id
				standard
				format
				power_type
				max_voltage
				max_amperage
				max_electric_power
				connector_type
				rate_setting
				status
				date_created
				date_modified
			}
			capabilities {
				id
				code
				description
			}
			payment_types {
				id
				code
				description
			}
		}
		facilities {
			id
			code
			description
		}
		parking_restrictions {
			id
			code
			description
		}
		parking_types {
			id
			code
			description
		}
	}
}
```

**Authorization: Basic BASIC_TOKEN**

**Arguments**

- **lat**
  - Decimal format for location's latitude
  - **Ex: 14.123451**
- **lng**
  - Decimal format for location's longitude
  - **Ex: 121.123451**
- **distance**
  - Maximum radius of location to filter
  - **Ex: 10**
- **city**
  - Location's city to filter
  - **Ex: 'Cabuyao'**
- **province**
  - Location's province to filter
  - **Ex: 'Laguna'**
- facilities
  - **Example input: ["CAFE","WIFI"]**
  - VALID VALUES:
    1. BANKS/ATM
    2. CAFE
    3. CINEMA
    4. DRUGSTORE
    5. GAS_STATION
    6. GROCERIES
    7. HARDWARE_SHOPS
    8. HOTEL
    9. MALL
    10. PARKING_LOT
    11. POOL
    12. RESTAURANTS
    13. RESTROOM
    14. SHOPS
    15. WATER_SPORTS
    16. WIFI
- capabilities
  - **Example input: ["QR_READER","CREDIT_DEBIT_PAYABLE"]**
  - VALID VALUES:
    1. CREDIT_DEBIT_PAYABLE
    2. QR_READER
    3. PRIVILEGE_AND_LOYALTY
- payment_types
  - **Example input: ["GCASH","MAYA"]**
  - VALID VALUES:
    1. GCASH
    2. MAYA
- parking_types
  - **Example input: ["INDOOR","OUTDOOR"]**
  - VALID VALUES:
    1. INDOOR
    2. OUTDOOR

**Response**

- List of filtered locations

---

### Query Get Location by ID

```graphql
query Location {
	location(id: 755) {
		id
		cpo_owner_id
		name
		address
		distance
		address_lat
		address_lng
		city
		province
		region
		postal_code
		country_code
		images
		publish
		date_created
		date_modified
		evses {
			uid
			evse_id
			serial_number
			meter_type
			status
			cpo_location_id
			current_ws_connection_id
			server_id
			date_created
			connectors {
				id
				evse_uid
				connector_id
				standard
				format
				power_type
				max_voltage
				max_amperage
				max_electric_power
				connector_type
				rate_setting
				status
				date_created
				date_modified
			}
			capabilities {
				id
				code
				description
			}
			payment_types {
				id
				code
				description
			}
		}
		facilities {
			id
			code
			description
		}
		parking_restrictions {
			id
			code
			description
		}
		parking_types {
			id
			code
			description
		}
	}
}
```

**Authorization: Bearer TOKEN**

**Arguments**

- **id**
  - Location's ID

**Response**

- Single Location Object
