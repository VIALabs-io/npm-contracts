"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Utility Functions", function () {
    let TestMessageClient;
    let testMessageClient;
    let MockMESSAGEv3;
    let mockMESSAGEv3;
    let MockFeeToken;
    let mockFeeToken;
    let owner;
    let addr1;
    let addr2;
    beforeEach(async function () {
        [owner, addr1, addr2] = await hardhat_1.ethers.getSigners();
        TestMessageClient = await hardhat_1.ethers.getContractFactory("TestMessageClient");
        testMessageClient = await TestMessageClient.deploy();
        await testMessageClient.deployed();
        MockMESSAGEv3 = await hardhat_1.ethers.getContractFactory("MockMESSAGEv3");
        mockMESSAGEv3 = await MockMESSAGEv3.deploy();
        await mockMESSAGEv3.deployed();
        MockFeeToken = await hardhat_1.ethers.getContractFactory("MockFeeToken");
        mockFeeToken = await MockFeeToken.deploy();
        await mockFeeToken.deployed();
        await mockMESSAGEv3.setFeeToken(mockFeeToken.address);
        await testMessageClient.configureClient(mockMESSAGEv3.address, [1, 2], [addr1.address, addr2.address], [1, 1]);
    });
    describe("isSelf", function () {
        it("Should return true for configured endpoint", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 1)).to.be.true;
            (0, chai_1.expect)(await testMessageClient.isSelf(addr2.address, 2)).to.be.true;
        });
        it("Should return false for non-configured endpoint", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(owner.address, 1)).to.be.false;
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 2)).to.be.false;
        });
        it("Should return false for non-existent chain", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 3)).to.be.false;
        });
        it("Should return false for zero address", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(hardhat_1.ethers.constants.AddressZero, 1)).to.be.false;
        });
        it("Should return false for zero chain ID", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 0)).to.be.false;
        });
    });
    describe("isAuthorized", function () {
        it("Should return true for configured endpoint", async function () {
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 1)).to.be.true;
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr2.address, 2)).to.be.true;
        });
        it("Should return false for non-configured endpoint", async function () {
            (0, chai_1.expect)(await testMessageClient.isAuthorized(owner.address, 1)).to.be.false;
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 2)).to.be.false;
        });
        it("Should return false for non-existent chain", async function () {
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 3)).to.be.false;
        });
        it("Should return false for zero address", async function () {
            (0, chai_1.expect)(await testMessageClient.isAuthorized(hardhat_1.ethers.constants.AddressZero, 1)).to.be.false;
        });
        it("Should return false for zero chain ID", async function () {
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 0)).to.be.false;
        });
    });
    describe("Gas estimation", function () {
        it("Should estimate gas correctly", async function () {
            const destinationChainId = 1;
            const messageData = hardhat_1.ethers.utils.defaultAbiCoder.encode(["string"], ["Test message"]);
            const gasEstimate = await testMessageClient.estimateGas.testSendMessage(destinationChainId, messageData);
            (0, chai_1.expect)(gasEstimate.gt(0)).to.be.true;
        });
    });
    describe("Interaction with contract state", function () {
        it("Should update isSelf and isAuthorized after reconfiguration", async function () {
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 1)).to.be.true;
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 1)).to.be.true;
            await testMessageClient.configureClient(mockMESSAGEv3.address, [1], [addr2.address], [1]);
            (0, chai_1.expect)(await testMessageClient.isSelf(addr1.address, 1)).to.be.false;
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr1.address, 1)).to.be.false;
            (0, chai_1.expect)(await testMessageClient.isSelf(addr2.address, 1)).to.be.true;
            (0, chai_1.expect)(await testMessageClient.isAuthorized(addr2.address, 1)).to.be.true;
        });
    });
});
