"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Deployment", function () {
    let TestMessageClient;
    let testMessageClient;
    let MockMESSAGEv3;
    let mockMESSAGEv3;
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
        // Configure the client with MockMESSAGEv3
        await testMessageClient.configureClient(mockMESSAGEv3.address, [], [], []);
    });
    it("Should set the right owner", async function () {
        (0, chai_1.expect)(await testMessageClient.MESSAGE_OWNER()).to.equal(owner.address);
    });
    it("Should initialize with configured MESSAGEv3", async function () {
        (0, chai_1.expect)(await testMessageClient.MESSAGEv3()).to.equal(mockMESSAGEv3.address);
    });
    it("Should initialize with empty FEE_TOKEN", async function () {
        (0, chai_1.expect)(await testMessageClient.FEE_TOKEN()).to.equal(hardhat_1.ethers.constants.AddressZero);
    });
    it("Should initialize with empty FEATURE_GATEWAY", async function () {
        (0, chai_1.expect)(await testMessageClient.FEATURE_GATEWAY()).to.equal(hardhat_1.ethers.constants.AddressZero);
    });
    it("Should deploy with different signers", async function () {
        const TestMessageClientAddr1 = await TestMessageClient.connect(addr1);
        const testMessageClientAddr1 = await TestMessageClientAddr1.deploy();
        await testMessageClientAddr1.deployed();
        (0, chai_1.expect)(await testMessageClientAddr1.MESSAGE_OWNER()).to.equal(addr1.address);
    });
    it("Should allow setting maxgas", async function () {
        const newMaxGas = 1000000;
        await (0, chai_1.expect)(testMessageClient.testSetMaxgas(newMaxGas)).to.not.be.reverted;
    });
    it("Should fail to set maxgas if called by non-owner", async function () {
        const newMaxGas = 1000000;
        await (0, chai_1.expect)(testMessageClient.connect(addr1).testSetMaxgas(newMaxGas))
            .to.be.revertedWith("MessageClient: not authorized");
    });
});
