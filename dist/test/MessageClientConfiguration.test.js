"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Configuration", function () {
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
    });
    describe("configureClient", function () {
        it("Should configure client correctly", async function () {
            const chains = [1, 2, 3];
            const endpoints = [addr1.address, addr2.address, owner.address];
            const confirmations = [1, 2, 3];
            await testMessageClient.configureClient(mockMESSAGEv3.address, chains, endpoints, confirmations);
            (0, chai_1.expect)(await testMessageClient.MESSAGEv3()).to.equal(mockMESSAGEv3.address);
            for (let i = 0; i < chains.length; i++) {
                const chainData = await testMessageClient.CHAINS(chains[i]);
                (0, chai_1.expect)(chainData.endpoint).to.equal(endpoints[i]);
                (0, chai_1.expect)(chainData.confirmations).to.equal(confirmations[i]);
            }
        });
        it("Should update existing configuration", async function () {
            const initialChains = [1];
            const initialEndpoints = [addr1.address];
            const initialConfirmations = [1];
            await testMessageClient.configureClient(mockMESSAGEv3.address, initialChains, initialEndpoints, initialConfirmations);
            const updatedChains = [1];
            const updatedEndpoints = [addr2.address];
            const updatedConfirmations = [2];
            await testMessageClient.configureClient(mockMESSAGEv3.address, updatedChains, updatedEndpoints, updatedConfirmations);
            const chainData = await testMessageClient.CHAINS(1);
            (0, chai_1.expect)(chainData.endpoint).to.equal(addr2.address);
            (0, chai_1.expect)(chainData.confirmations).to.equal(2);
        });
        it("Should fail with mismatched array lengths", async function () {
            const chains = [1, 2];
            const endpoints = [addr1.address];
            const confirmations = [1, 2];
            await (0, chai_1.expect)(testMessageClient.configureClient(mockMESSAGEv3.address, chains, endpoints, confirmations)).to.be.reverted;
        });
        it("Should fail if called by non-owner", async function () {
            const chains = [1];
            const endpoints = [addr1.address];
            const confirmations = [1];
            await (0, chai_1.expect)(testMessageClient.connect(addr1).configureClient(mockMESSAGEv3.address, chains, endpoints, confirmations)).to.be.revertedWith("MessageClient: not authorized");
        });
    });
    describe("configureFeatureGateway", function () {
        it("Should configure feature gateway correctly", async function () {
            await testMessageClient.configureFeatureGateway(addr1.address);
            (0, chai_1.expect)(await testMessageClient.FEATURE_GATEWAY()).to.equal(addr1.address);
        });
        it("Should update existing feature gateway configuration", async function () {
            await testMessageClient.configureFeatureGateway(addr1.address);
            await testMessageClient.configureFeatureGateway(addr2.address);
            (0, chai_1.expect)(await testMessageClient.FEATURE_GATEWAY()).to.equal(addr2.address);
        });
        it("Should fail if called by non-owner", async function () {
            await (0, chai_1.expect)(testMessageClient.connect(addr1).configureFeatureGateway(addr2.address)).to.be.revertedWith("MessageClient: not authorized");
        });
    });
});
