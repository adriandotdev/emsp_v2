# EMSP v2.0 Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.0] - 2024-08-02

### Added

- API for updating connector status

  `/ocpi/hub/2.2/locations/:country_code/:party_id/:location_id/:evse_uid/:connector_id`

### Changes

- Initial staging release
- API for adding new locations

  From `/ocpi/cpo/api/v1/webhook/locations/:country_code/:party_id` to `/ocpi/hub/2.2/locations/:country_code/:party_id`

- API for adding evse

  From `/ocpi/cpo/api/v1/webhook/evse/:country_code/:party_id` to `/ocpi/hub/2.2/locations/evse/:country_code/:party_id/:location_id`

## [1.0.1] - 2024-08-05

### Added

- Websocket Connection
