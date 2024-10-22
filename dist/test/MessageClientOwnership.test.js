"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Ownership", function () {
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
        await testMessageClient.configureClient(mockMESSAGEv3.address, [], [], []);
    });
    describe("transferMessageOwnership", function () {
        it("Should transfer ownership", async function () {
            await testMessageClient.transferMessageOwnership(addr1.address);
            (0, chai_1.expect)(await testMessageClient.MESSAGE_OWNER()).to.equal(addr1.address);
        });
        it("Should emit MessageOwnershipTransferred event", async function () {
            await (0, chai_1.expect)(testMessageClient.transferMessageOwnership(addr1.address))
                .to.emit(testMessageClient, "MessageOwnershipTransferred")
                .withArgs(owner.address, addr1.address);
        });
        it("Should fail if called by non-owner", async function () {
            await (0, chai_1.expect)(testMessageClient.connect(addr1).transferMessageOwnership(addr2.address)).to.be.revertedWith("MessageClient: not authorized");
        });
        it("Should allow new owner to perform owner-only actions after transfer", async function () {
            await testMessageClient.transferMessageOwnership(addr1.address);
            await (0, chai_1.expect)(testMessageClient.connect(addr1).testSetMaxgas(1000)).to.not.be.reverted;
        });
        it("Should prevent old owner from performing owner-only actions after transfer", async function () {
            await testMessageClient.transferMessageOwnership(addr1.address);
            await (0, chai_1.expect)(testMessageClient.testSetMaxgas(1000)).to.be.revertedWith("MessageClient: not authorized");
        });
    });
    describe("onlyMessageOwner modifier", function () {
        it("Should allow owner to call onlyMessageOwner functions", async function () {
            await (0, chai_1.expect)(testMessageClient.testSetMaxgas(1000)).to.not.be.reverted;
        });
        it("Should prevent non-owner from calling onlyMessageOwner functions", async function () {
            await (0, chai_1.expect)(testMessageClient.connect(addr1).testSetMaxgas(1000)).to.be.revertedWith("MessageClient: not authorized");
        });
    });
    describe("Ownership and contract functionality", function () {
        it("Should allow only owner to configure client", async function () {
            await (0, chai_1.expect)(testMessageClient.configureClient(mockMESSAGEv3.address, [1], [addr1.address], [1])).to.not.be.reverted;
            await (0, chai_1.expect)(testMessageClient.connect(addr1).configureClient(mockMESSAGEv3.address, [1], [addr2.address], [1]))
                .to.be.revertedWith("MessageClient: not authorized");
        });
        it("Should maintain configurations after ownership transfer", async function () {
            await testMessageClient.configureClient(mockMESSAGEv3.address, [1], [addr1.address], [1]);
            await testMessageClient.transferMessageOwnership(addr2.address);
            const chainData = await testMessageClient.CHAINS(1);
            (0, chai_1.expect)(chainData.endpoint).to.equal(addr1.address);
            (0, chai_1.expect)(chainData.confirmations).to.equal(1);
        });
    });
});
