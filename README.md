# EMSP Version 2.0 APIs

## REST APIs

### `POST Register Charging Point Operator - /ocpi/cpo/2.2/register`

**Authorization: Bearer TOKEN**

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

**Authorization: Bearer ACCESS_TOKEN**

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

**Authorization: Bearer TOKEN**

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

### `POST Upload Location Photos - /2.2/locations/photos/uploads`

**Authorization: Bearer TOKEN**

**Request Body**

- location_photos
  - maximum 5 files
- location_id
  - Location ID

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "Success"
}
```

### `POST Refresh Token API - /ocpi/cpo/api/auth/v1/refresh`

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

**Response**

- List of EVSEs

--

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

**Response**

- List of Locations
