# EMSP Version 2.0 APIs

- [EMSP Version 2.0 APIs](#emsp-version-20-apis)
  - [REST APIs](#rest-apis)
    - [POST Register Charge Point Operator - `/ocpi/cpo/2.2/register`](#post-register-charge-point-operator---ocpicpo22register)
    - [POST Upload CPO Logo - `/ocpi/cpo/2.2/cpo/upload`](#post-upload-cpo-logo---ocpicpo22cpoupload)
    - [POST Login API - `/ocpi/cpo/api/auth/v1/login`](#post-login-api---ocpicpoapiauthv1login)
    - [POST Upload Location Photos - `/ocpi/cpo/api/v1/locations/photos/uploads`](#post-upload-location-photos---ocpicpoapiv1locationsphotosuploads)
    - [PATCH Update Location Photo by ID - `/ocpi/cpo/api/v1/locations/photos/uploads/:photo_id`](#patch-update-location-photo-by-id---ocpicpoapiv1locationsphotosuploadsphoto_id)
    - [GET Refresh Token API - `/ocpi/cpo/api/auth/v1/refresh`](#get-refresh-token-api---ocpicpoapiauthv1refresh)
    - [POST Logout API - `/ocpi/cpo/api/auth/v1/logout`](#post-logout-api---ocpicpoapiauthv1logout)
    - [POST Change Old Password API - `/ocpi/cpo/api/auth/v1/change-old-password`](#post-change-old-password-api---ocpicpoapiauthv1change-old-password)
    - [POST Register Locations through CSV - `/ocpi/cpo/api/v2/locations/uploads/csv`](#post-register-locations-through-csv---ocpicpoapiv2locationsuploadscsv)
    - [GET Default Filters - `/ocpi/cpo/2.2/filters`](#get-default-filters---ocpicpo22filters)
    - [GET List of Cities by Province - `/ocpi/cpo/2.2/filters/cities/:province_name`](#get-list-of-cities-by-province---ocpicpo22filterscitiesprovince_name)
    - [GET Charging Point Operator (CPO) Details - `/ocpi/cpo/2.2/details`](#get-charging-point-operator-cpo-details---ocpicpo22details)
    - [PATCH Update CPO Logo by CPO Owner ID - `/ocpi/cpo/2.2/cpo/logo/upload`](#patch-update-cpo-logo-by-cpo-owner-id---ocpicpo22cpologoupload)
    - [GET Pending Locations and EVSEs - `/ocpi/cpo/2.2/locations/pending`](#get-pending-locations-and-evses---ocpicpo22locationspending)
  - [GraphQL APIs](#graphql-apis)
    - [Query EVSEs](#query-evses)
    - [Query Locations](#query-locations)
    - [Query FindEV Locations](#query-findev-locations)
    - [Query FindEV Filter Locations](#query-findev-filter-locations)
    - [Query Get Location by ID](#query-get-location-by-id)
  - [OCPI APIs](#ocpi-apis)
    - [POST OCPI Add Location - `/ocpi/hub/2.2/locations/:country_code/:party_id`](#post-ocpi-add-location---ocpihub22locationscountry_codeparty_id)
    - [POST OCPI Add EVSE - `/ocpi/hub/2.2/locations/evse/:country_code/:party_id/:location_id`](#post-ocpi-add-evse---ocpihub22locationsevsecountry_codeparty_idlocation_id)
    - [PUT OCPI Update EVSE Status - `/ocpi/hub/2.2/locations/:country_code/:party_id/:location_id/:evse_uid/:connector_id`](#put-ocpi-update-evse-status---ocpihub22locationscountry_codeparty_idlocation_idevse_uidconnector_id)
    - [POST /ocpi/hub/2.2/locations/temp/:country_code/:party_id](#post-ocpihub22locationstempcountry_codeparty_id)

## REST APIs

### POST Register Charge Point Operator - `/ocpi/cpo/2.2/register`

**Description**

Registers Charge Point Operator.

**Authorization: Basic TOKEN**

**Request Body**

```json
{
	"username": "solarius", // required
	"cpo_owner_name": "Solarius", // required
	"contact_name": "Solarius CEO", // required
	"contact_number": "09123456782", // required
	"contact_email": "solarius@gmail.com", // required
	"ocpp_ready": true, // optional
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

[Back to Top](#emsp-version-20-apis)

---

### POST Upload CPO Logo - `/ocpi/cpo/2.2/cpo/upload`

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

[Back to Top](#emsp-version-20-apis)

---

### POST Login API - `/ocpi/cpo/api/auth/v1/login`

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

[Back to Top](#emsp-version-20-apis)

---

### POST Upload Location Photos - `/ocpi/cpo/api/v1/locations/photos/uploads`

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

[Back to Top](#emsp-version-20-apis)

---

### PATCH Update Location Photo by ID - `/ocpi/cpo/api/v1/locations/photos/uploads/:photo_id`

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

[Back to Top](#emsp-version-20-apis)

---

### GET Refresh Token API - `/ocpi/cpo/api/auth/v1/refresh`

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

[Back to Top](#emsp-version-20-apis)

---

### POST Logout API - `/ocpi/cpo/api/auth/v1/logout`

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

[Back to Top](#emsp-version-20-apis)

---

### POST Change Old Password API - `/ocpi/cpo/api/auth/v1/change-old-password`

**Authorization: Bearer ACCESS_TOKEN**

**Response**

```json
{
	"status": 200,
	"data": "SUCCESS",
	"message": "Success"
}
```

**Errors**

- Unauthorized
- Internal Server Error
- Bad Request

---

### POST Register Locations through CSV - `/ocpi/cpo/api/v2/locations/uploads/csv`

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

### GET Default Filters - `/ocpi/cpo/2.2/filters`

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

### GET List of Cities by Province - `/ocpi/cpo/2.2/filters/cities/:province_name`

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

### GET Charging Point Operator (CPO) Details - `/ocpi/cpo/2.2/details`

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

### PATCH Update CPO Logo by CPO Owner ID - `/ocpi/cpo/2.2/cpo/logo/upload`

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

[Back to Top](#emsp-version-20-apis)

---

### GET Pending Locations and EVSEs - `/ocpi/cpo/2.2/locations/pending`

**Authorization: Bearer TOKEN**

**Response**

```json
{
	"status": 200,
	"data": [
		{
			"pending_locations": 1,
			"pending_evses": 2
		}
	],
	"message": "Success"
}
```

**NOTE: When there are no pending locations and evses. The response would be:**

```json
{
	"status": 200,
	"data": "NO_PENDING_LOCATIONS_AND_EVSES",
	"message": "Success"
}
```

---

---

## GraphQL APIs

### Query EVSEs

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

[Back to Top](#emsp-version-20-apis)

---

### Query Locations

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

[Back to Top](#emsp-version-20-apis)

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

[Back to Top](#emsp-version-20-apis)

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

- **id** - Location's ID

**Response**

- Single Location Object

[Back to Top](#emsp-version-20-apis)

---

---

## OCPI APIs

### POST OCPI Add Location - `/ocpi/hub/2.2/locations/:country_code/:party_id`

**Description**

A webhook for registering new locations together with its evses, and connectors.

**Authorization: Bearer TOKEN_C**

**Parameters**

- country_code: Location's country code.
- party_id: Location's associated party ID.

**Requst Body**

```json
{
	"locations": [
		{
			"name": "Yan-Yan's Store",
			"address": "BLK 137 LOT 3, Phase 2, Cabuyao, Laguna",
			"lat": "14.12345",
			"lng": "121.12345",
			"evses": [
				{
					"uid": "123456689",
					"status": "AVAILABLE",
					"meter_type": "AC",
					"kwh": 7,
					"connectors": [
						{
							"standard": "CHADEMO",
							"format": "SOCKET",
							"power_type": "AC",
							"max_voltage": 230,
							"max_amperage": 16,
							"max_electric_power": 120
						}
					],
					"capabilities": ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
					"payment_types": ["GCASH", "MAYA"]
				},
				{
					"uid": "123",
					"status": "AVAILABLE",
					"meter_type": "AC",
					"kwh": 7,
					"connectors": [
						{
							"standard": "TYPE_2",
							"format": "SOCKET",
							"power_type": "AC",
							"max_voltage": 230,
							"max_amperage": 16,
							"max_electric_power": 120
						}
					],
					"capabilities": ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
					"payment_types": ["GCASH", "MAYA"]
				}
			],
			"facilities": ["CINEMA", "CAFE"],
			"parking_types": ["INDOOR"],
			"parking_restrictions": ["CUSTOMERS", "DISABLED"]
		}
	]
}
```

**Response**

```json
{
	"status": 200,
	"data": [
		{
			"location_id": 754
		}
	], // list of location id
	"message": "Success"
}
```

[Back to Top](#emsp-version-20-apis)

---

### POST OCPI Add EVSE - `/ocpi/hub/2.2/locations/evse/:country_code/:party_id/:location_id`

**Authorization: Bearer CPO_TOKEN_C**

**Parameters**

- country_code: Location's country code.
- party_id: Location's associated party ID.

**Request Body**

```json
{
	"location_id": 176,
	"uid": "123456689",
	"status": "AVAILABLE",
	"meter_type": "AC",
	"kwh": 7,
	"connectors": [
		{
			"standard": "CHADEMO",
			"format": "SOCKET",
			"power_type": "AC",
			"max_voltage": 230,
			"max_amperage": 16,
			"max_electric_power": 120
		}
	],
	"capabilities": ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
	"payment_types": ["GCASH", "MAYA"]
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

[Back to Top](#emsp-version-20-apis)

---

### PUT OCPI Update EVSE Status - `/ocpi/hub/2.2/locations/:country_code/:party_id/:location_id/:evse_uid/:connector_id`

**Description**

Registers location for approval

**Authorization: Bearer TOKEN_C**

**Parameters**

- country_code
- location_id
- evse_uid
- connector_id

**Request Body**

```json
{
	"status": "CHARGING" // AVAILABLE, RESERVED, CHARGING
}
```

**Response Body**

```json
{
	"status": 200,
	"data": "SUCCESS",
	"message": "Success"
}
```

[Back to Top](#emsp-version-20-apis)

---

### POST /ocpi/hub/2.2/locations/temp/:country_code/:party_id

**Authorization: Bearer TOKEN_C**

**Parameters**

- country_code
- party_id

**Request Body**

```json
{
	"locations": [
		{
			"name": "Yan-Yan's Store",
			"address": "BLK 137 LOT 3, Phase 2, Cabuyao, Laguna",
			"coordinates": {
				"latitude": "14.12347",
				"longitude": "121.12345"
			},
			"evses": [
				{
					"uid": "555555551",
					"status": "AVAILABLE",
					"meter_type": "AC",
					"kwh": 7,
					"connectors": [
						{
							"standard": "CHADEMO",
							"format": "SOCKET",
							"power_type": "AC",
							"max_voltage": 230,
							"max_amperage": 16,
							"max_electric_power": 120
						},
						{
							"standard": "TYPE_2",
							"format": "SOCKET",
							"power_type": "AC",
							"max_voltage": 230,
							"max_amperage": 16,
							"max_electric_power": 120
						}
					],
					"capabilities": ["CREDIT_DEBIT_PAYABLE", "QR_READER"],
					"payment_types": ["GCASH", "MAYA"],
					"floor_level": 1,
					"direction": "Go near Makati Ave"
				}
			],
			"facilities": ["CINEMA", "CAFE"],
			"parking_types": ["INDOOR"],
			"parking_restrictions": ["CUSTOMERS", "DISABLED"]
		}
	]
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

[Back to Top](#emsp-version-20-apis)
