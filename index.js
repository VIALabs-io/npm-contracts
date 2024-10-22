// This file serves as the entry point for the @vialabs-io/contracts package
// It exports all the contracts so they can be easily imported by other projects

const MessageClient = require('./artifacts/MessageClient.sol/MessageClient.json');

module.exports = {
  MessageClient,
  // Add other contracts here as needed
};
