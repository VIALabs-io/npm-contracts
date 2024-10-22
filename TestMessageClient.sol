// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./MessageClient.sol";

contract TestMessageClient is MessageClient {
    event MessageProcessed(
        uint txId,
        uint sourceChainId,
        bytes messageData,
        uint32 featureId,
        bytes featureData,
        bytes featureResponse
    );

    function _processMessageWithFeature(
        uint _txId,
        uint _sourceChainId,
        bytes memory _messageData,
        uint32 _featureId,
        bytes memory _featureData,
        bytes memory _featureResponse
    ) internal override {
        emit MessageProcessed(_txId, _sourceChainId, _messageData, _featureId, _featureData, _featureResponse);
    }

    function testSendMessage(uint _destinationChainId, bytes memory _data) external returns (uint) {
        return _sendMessage(_destinationChainId, _data);
    }

    function testSendMessageWithFeature(uint _destinationChainId, bytes memory _messageData, uint32 _featureId, bytes memory _featureData) external returns (uint) {
        return _sendMessageWithFeature(_destinationChainId, _messageData, _featureId, _featureData);
    }

    function testProcessMessage(uint _txId, uint _sourceChainId, bytes calldata _data) external {
        _processMessage(_txId, _sourceChainId, _data);
    }

    // Override messageProcess function for testing
    function messageProcess(
        uint _txId,
        uint _sourceChainId,
        address _sender,
        address,
        uint,
        bytes calldata _data
    ) external override onlySelf(_sender, _sourceChainId) {
        _processMessage(_txId, _sourceChainId, _data);
    }

    // Add a public function to call setMaxgas for testing
    function testSetMaxgas(uint _maxGas) public {
        setMaxgas(_maxGas);
    }
}
