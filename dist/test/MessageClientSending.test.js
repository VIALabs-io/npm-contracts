"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Sending", function () {
    let TestMessageClient;
    let testMessageClient;
    let MockMESSAGEv3;
    let mockMESSAGEv3;
    let MockFeeToken;
    let mockFeeToken;
    let MockFeatureGateway;
    let mockFeatureGateway;
    let owner;
    let addr1;
    let addr2;
    beforeEach(async function () {
        [owner, addr1, addr2] = await hardhat_1.ethers.getSigners();
        MockMESSAGEv3 = await hardhat_1.ethers.getContractFactory("MockMESSAGEv3");
        mockMESSAGEv3 = await MockMESSAGEv3.deploy();
        await mockMESSAGEv3.deployed();
        MockFeeToken = await hardhat_1.ethers.getContractFactory("MockFeeToken");
        mockFeeToken = await MockFeeToken.deploy();
        await mockFeeToken.deployed();
        MockFeatureGateway = await hardhat_1.ethers.getContractFactory("MockFeatureGateway");
        mockFeatureGateway = await MockFeatureGateway.deploy(mockMESSAGEv3.address);
        await mockFeatureGateway.deployed();
        TestMessageClient = await hardhat_1.ethers.getContractFactory("TestMessageClient");
        testMessageClient = await TestMessageClient.deploy();
        await testMessageClient.deployed();
        await mockMESSAGEv3.setFeeToken(mockFeeToken.address);
        await testMessageClient.configureClient(mockMESSAGEv3.address, [1, 2], [addr1.address, addr2.address], [1, 1]);
        await testMessageClient.configureFeatureGateway(mockFeatureGateway.address);
        // Set up feature in the MockFeatureGateway
        await mockFeatureGateway.addFeature(1, mockFeatureGateway.address);
        // Mint some fee tokens to the testMessageClient
        await mockFeeToken.mint(testMessageClient.address, hardhat_1.ethers.utils.parseEther("1000"));
    });
    describe("_sendMessage", function () {
        it("Should send message correctly", async function () {
            const destinationChainId = 1;
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            await (0, chai_1.expect)(testMessageClient.testSendMessage(destinationChainId, messageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr1.address, destinationChainId, messageData, 1, false);
        });
        it("Should send message to multiple destination chains", async function () {
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            await (0, chai_1.expect)(testMessageClient.testSendMessage(1, messageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr1.address, 1, messageData, 1, false);
            await (0, chai_1.expect)(testMessageClient.testSendMessage(2, messageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr2.address, 2, messageData, 1, false);
        });
        it("Should handle empty messages", async function () {
            const destinationChainId = 1;
            const emptyMessageData = "0x";
            await (0, chai_1.expect)(testMessageClient.testSendMessage(destinationChainId, emptyMessageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr1.address, destinationChainId, emptyMessageData, 1, false);
        });
        it("Should handle large message size", async function () {
            const destinationChainId = 1;
            const largeMessageData = "0x" + "ff".repeat(1024); // 1KB of data
            await (0, chai_1.expect)(testMessageClient.testSendMessage(destinationChainId, largeMessageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr1.address, destinationChainId, largeMessageData, 1, false);
        });
        it("Should send message with complex data structure", async function () {
            const destinationChainId = 1;
            const complexData = {
                id: 123,
                name: "Complex Message",
                isValid: true,
                amounts: [100, 200, 300],
                nestedStruct: {
                    key: "nested",
                    value: 456
                }
            };
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["tuple(uint256 id, string name, bool isValid, uint256[] amounts, tuple(string key, uint256 value) nestedStruct)"], [complexData]);
            await (0, chai_1.expect)(testMessageClient.testSendMessage(destinationChainId, messageData))
                .to.emit(mockMESSAGEv3, "MessageSent")
                .withArgs(addr1.address, destinationChainId, messageData, 1, false);
        });
    });
    describe("_sendMessageWithFeature", function () {
        it("Should send message with feature correctly", async function () {
            const destinationChainId = 1;
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            const featureId = 1;
            const featureData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Feature data"]);
            await (0, chai_1.expect)(testMessageClient.testSendMessageWithFeature(destinationChainId, messageData, featureId, featureData))
                .to.emit(testMessageClient, "SendMessageWithFeature")
                .withArgs(1, destinationChainId, featureId, featureData);
        });
        it("Should revert if feature is not enabled", async function () {
            const destinationChainId = 1;
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            const featureId = 2; // This feature is not enabled
            const featureData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Feature data"]);
            await (0, chai_1.expect)(testMessageClient.testSendMessageWithFeature(destinationChainId, messageData, featureId, featureData))
                .to.be.revertedWith("MessageClient: feature not enabled");
        });
    });
    describe("Gas consumption", function () {
        it("Should have somewhat consistent gas consumption for different message sizes", async function () {
            const destinationChainId = 1;
            const smallMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Small"]);
            const mediumMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Medium".repeat(10)]);
            const largeMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Large".repeat(100)]);
            const smallGas = await testMessageClient.estimateGas.testSendMessage(destinationChainId, smallMessage);
            const mediumGas = await testMessageClient.estimateGas.testSendMessage(destinationChainId, mediumMessage);
            const largeGas = await testMessageClient.estimateGas.testSendMessage(destinationChainId, largeMessage);
            console.log("Gas used - Small message:", smallGas.toString());
            console.log("Gas used - Medium message:", mediumGas.toString());
            console.log("Gas used - Large message:", largeGas.toString());
            // Check that gas consumption increases with message size
            (0, chai_1.expect)(mediumGas).to.be.gt(smallGas);
            (0, chai_1.expect)(largeGas).to.be.gt(mediumGas);
            // Check that the increase is not exponential
            const smallToMediumRatio = mediumGas.div(smallGas);
            const mediumToLargeRatio = largeGas.div(mediumGas);
            (0, chai_1.expect)(mediumToLargeRatio).to.be.lt(smallToMediumRatio.mul(10)); // Allow for up to 10x increase
        });
    });
});
