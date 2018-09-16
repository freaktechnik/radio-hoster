# radio-hoster

[![Greenkeeper badge](https://badges.greenkeeper.io/freaktechnik/radio-hoster.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/freaktechnik/radio-hoster.svg?branch=master)](https://travis-ci.org/freaktechnik/radio-hoster)

Auto hosts talk shows on Twitch to create a radio channel of sorts.

Currently running on https://twitch.tv/hostedradio

## How it works
The service periodically checks for top streams in given categories. It prefers
streams in the "Talk Show" category, and then falls back to "Music". Talk show
streams are required to be in a certain language, currently configured to English.

the top stream is then hosted as long as it stays live. If it's a rebroadcast
(identified by title details like containing "24/7" or by twitch status) or if
it is in the `ignore-livestate` JSON for the current language, it will not stay
hosted as long as it's live. Any more popular stream will superseed it.

The `stream-schedule` JSON for the current language forces some streams to be hosted
if they are live in certain time frames. This allows for fixed programming of regular
shows.

## Configuration
Client configuration is done via environment. The following variables are required:
- `CLIENT_ID`: Twitch API Client ID to use
- `TOKEN`: Twitch API token. Relies on having an old enough app to get a non-expiring token.
- `USERNAME`: Username of the channel to host on

The data folder contains JSON files that are used to help decide what to host when.

## Running
Before running the service, you will want to install all dependencies with `npm i --production`
and ensure the environment variables are set. After that you can start it with `npm start`
(assuming the node executable is available as `node`).

If running with `npm start` does not work, try running [index.js](index.js) with node.js.

## Testing
All the current tests are just JSON schema tests for the JSON files in data.
