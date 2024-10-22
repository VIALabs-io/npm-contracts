"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
describe("MessageClient Receiving", function () {
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
        // Set up bridge operator
        await mockMESSAGEv3.setBridgeOperator(mockMESSAGEv3.address, true);
        // Set up feature in the MockFeatureGateway
        await mockFeatureGateway.addFeature(0, mockFeatureGateway.address);
        await mockFeatureGateway.addFeature(1, mockFeatureGateway.address);
        // Impersonate the MockMESSAGEv3 contract and fund it
        await (0, hardhat_network_helpers_1.impersonateAccount)(mockMESSAGEv3.address);
        await (0, hardhat_network_helpers_1.setBalance)(mockMESSAGEv3.address, hardhat_1.ethers.utils.parseEther("1"));
    });
    afterEach(async function () {
        // Stop impersonating the MockMESSAGEv3 contract
        await (0, hardhat_network_helpers_1.stopImpersonatingAccount)(mockMESSAGEv3.address);
    });
    describe("messageProcess", function () {
        it("Should process message correctly", async function () {
            const txId = 1;
            const sourceChainId = 1;
            const sender = addr1.address;
            const recipient = hardhat_1.ethers.constants.AddressZero;
            const amount = 0;
            const featureId = 0;
            const featureData = "0x";
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            const data = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, messageData]);
            await mockFeatureGateway.setFeaturePayload(txId, "0x1234");
            const mockMESSAGEv3Signer = await hardhat_1.ethers.getSigner(mockMESSAGEv3.address);
            await (0, chai_1.expect)(testMessageClient.connect(mockMESSAGEv3Signer).messageProcess(txId, sourceChainId, sender, recipient, amount, data))
                .to.emit(testMessageClient, "MessageProcessed")
                .withArgs(txId, sourceChainId, messageData, featureId, featureData, "0x1234");
        });
        it("Should process message with complex data types", async function () {
            const txId = 2;
            const sourceChainId = 1;
            const sender = addr1.address;
            const recipient = hardhat_1.ethers.constants.AddressZero;
            const amount = 0;
            const featureId = 0;
            const featureData = "0x";
            const complexData = {
                number: 12345,
                address: addr2.address,
                string: "Complex message",
                array: [1, 2, 3]
            };
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["tuple(uint256 number, address address, string string, uint256[] array)"], [complexData]);
            const data = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, messageData]);
            await mockFeatureGateway.setFeaturePayload(txId, "0x5678");
            const mockMESSAGEv3Signer = await hardhat_1.ethers.getSigner(mockMESSAGEv3.address);
            await (0, chai_1.expect)(testMessageClient.connect(mockMESSAGEv3Signer).messageProcess(txId, sourceChainId, sender, recipient, amount, data))
                .to.emit(testMessageClient, "MessageProcessed")
                .withArgs(txId, sourceChainId, messageData, featureId, featureData, "0x5678");
        });
        it("Should handle empty message data", async function () {
            const txId = 3;
            const sourceChainId = 1;
            const sender = addr1.address;
            const recipient = hardhat_1.ethers.constants.AddressZero;
            const amount = 0;
            const featureId = 0;
            const featureData = "0x";
            const messageData = "0x";
            const data = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, messageData]);
            await mockFeatureGateway.setFeaturePayload(txId, "0x");
            const mockMESSAGEv3Signer = await hardhat_1.ethers.getSigner(mockMESSAGEv3.address);
            await (0, chai_1.expect)(testMessageClient.connect(mockMESSAGEv3Signer).messageProcess(txId, sourceChainId, sender, recipient, amount, data))
                .to.emit(testMessageClient, "MessageProcessed")
                .withArgs(txId, sourceChainId, messageData, featureId, featureData, "0x");
        });
        it("Should process message from different source chains", async function () {
            const txId = 4;
            const sourceChainId = 2;
            const sender = addr2.address;
            const recipient = hardhat_1.ethers.constants.AddressZero;
            const amount = 0;
            const featureId = 0;
            const featureData = "0x";
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Message from chain 2"]);
            const data = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, messageData]);
            await mockFeatureGateway.setFeaturePayload(txId, "0xabcd");
            const mockMESSAGEv3Signer = await hardhat_1.ethers.getSigner(mockMESSAGEv3.address);
            await (0, chai_1.expect)(testMessageClient.connect(mockMESSAGEv3Signer).messageProcess(txId, sourceChainId, sender, recipient, amount, data))
                .to.emit(testMessageClient, "MessageProcessed")
                .withArgs(txId, sourceChainId, messageData, featureId, featureData, "0xabcd");
        });
        it("Should revert if called by unauthorized sender", async function () {
            const txId = 6;
            const sourceChainId = 1;
            const sender = addr2.address; // Unauthorized sender
            const recipient = hardhat_1.ethers.constants.AddressZero;
            const amount = 0;
            const data = "0x";
            await (0, chai_1.expect)(testMessageClient.connect(addr2).messageProcess(txId, sourceChainId, sender, recipient, amount, data))
                .to.be.revertedWith("MessageClient: not authorized");
        });
    });
    describe("_processMessage", function () {
        it("Should process message with feature correctly", async function () {
            const txId = 1;
            const sourceChainId = 1;
            const featureId = 0;
            const featureData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Feature data"]);
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            const data = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, messageData]);
            await mockFeatureGateway.setFeaturePayload(txId, "0x1234");
            await (0, chai_1.expect)(testMessageClient.testProcessMessage(txId, sourceChainId, data))
                .to.emit(testMessageClient, "MessageProcessed")
                .withArgs(txId, sourceChainId, messageData, featureId, featureData, "0x1234");
        });
    });
    describe("Gas consumption", function () {
        it("Should have somewhat consistent gas consumption for different message sizes", async function () {
            const txId = 1;
            const sourceChainId = 1;
            const featureId = 0;
            const featureData = "0x";
            const smallMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Small message"]);
            const mediumMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Medium message".repeat(100)]);
            const largeMessage = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Large message".repeat(1000)]);
            const smallData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, smallMessage]);
            const mediumData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, mediumMessage]);
            const largeData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["uint32", "bytes", "bytes"], [featureId, featureData, largeMessage]);
            await mockFeatureGateway.setFeaturePayload(txId, "0x");
            const smallGas = await testMessageClient.estimateGas.testProcessMessage(txId, sourceChainId, smallData);
            const mediumGas = await testMessageClient.estimateGas.testProcessMessage(txId, sourceChainId, mediumData);
            const largeGas = await testMessageClient.estimateGas.testProcessMessage(txId, sourceChainId, largeData);
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
