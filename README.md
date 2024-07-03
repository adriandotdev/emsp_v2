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
