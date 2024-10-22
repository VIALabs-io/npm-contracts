"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("MessageClient Token Recovery", function () {
    let TestMessageClient;
    let testMessageClient;
    let MockMESSAGEv3;
    let mockMESSAGEv3;
    let MockFeeToken;
    let mockFeeToken;
    let MockERC20;
    let mockERC20;
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
        MockERC20 = await hardhat_1.ethers.getContractFactory("MockFeeToken"); // Using MockFeeToken as a generic ERC20
        mockERC20 = await MockERC20.deploy();
        await mockERC20.deployed();
        // Send some ETH to the contract
        await owner.sendTransaction({
            to: testMessageClient.address,
            value: hardhat_1.ethers.utils.parseEther("1.0")
        });
        // Mint some tokens and send them to the contract
        await mockFeeToken.mint(testMessageClient.address, hardhat_1.ethers.utils.parseEther("100"));
        await mockERC20.mint(testMessageClient.address, hardhat_1.ethers.utils.parseEther("100"));
        // Configure the MockMESSAGEv3 with the fee token
        await mockMESSAGEv3.setFeeToken(mockFeeToken.address);
        // Configure the client with MockMESSAGEv3
        await testMessageClient.configureClient(mockMESSAGEv3.address, [], [], []);
    });
    describe("recoverToken", function () {
        it("Should recover ETH correctly", async function () {
            const initialBalance = await owner.getBalance();
            const amount = hardhat_1.ethers.utils.parseEther("0.5");
            await (0, chai_1.expect)(testMessageClient.recoverToken(hardhat_1.ethers.constants.AddressZero, amount))
                .to.emit(testMessageClient, "RecoverToken")
                .withArgs(owner.address, hardhat_1.ethers.constants.AddressZero, amount);
            const finalBalance = await owner.getBalance();
            (0, chai_1.expect)(finalBalance.sub(initialBalance)).to.be.closeTo(amount, hardhat_1.ethers.utils.parseEther("0.001")); // Account for gas costs
        });
        it("Should recover ERC20 tokens correctly", async function () {
            const amount = hardhat_1.ethers.utils.parseEther("50");
            await (0, chai_1.expect)(testMessageClient.recoverToken(mockFeeToken.address, amount))
                .to.emit(testMessageClient, "RecoverToken")
                .withArgs(owner.address, mockFeeToken.address, amount);
            (0, chai_1.expect)(await mockFeeToken.balanceOf(owner.address)).to.equal(amount);
        });
        it("Should fail if called by non-owner", async function () {
            const amount = hardhat_1.ethers.utils.parseEther("0.5");
            await (0, chai_1.expect)(testMessageClient.connect(addr1).recoverToken(hardhat_1.ethers.constants.AddressZero, amount))
                .to.be.revertedWith("MessageClient: not authorized");
        });
        it("Should fail if trying to recover more ETH than available", async function () {
            const amount = hardhat_1.ethers.utils.parseEther("2.0"); // More than the contract balance
            await (0, chai_1.expect)(testMessageClient.recoverToken(hardhat_1.ethers.constants.AddressZero, amount))
                .to.be.reverted;
        });
        it("Should fail if trying to recover more tokens than available", async function () {
            const amount = hardhat_1.ethers.utils.parseEther("150"); // More than the contract balance
            await (0, chai_1.expect)(testMessageClient.recoverToken(mockFeeToken.address, amount))
                .to.be.reverted;
        });
        it("Should not revert when trying to recover 0 tokens", async function () {
            await (0, chai_1.expect)(testMessageClient.recoverToken(mockFeeToken.address, 0))
                .to.emit(testMessageClient, "RecoverToken")
                .withArgs(owner.address, mockFeeToken.address, 0);
        });
        it("Should allow recovery after ownership transfer", async function () {
            await testMessageClient.transferMessageOwnership(addr1.address);
            const amount = hardhat_1.ethers.utils.parseEther("0.5");
            await (0, chai_1.expect)(testMessageClient.connect(addr1).recoverToken(hardhat_1.ethers.constants.AddressZero, amount))
                .to.emit(testMessageClient, "RecoverToken")
                .withArgs(addr1.address, hardhat_1.ethers.constants.AddressZero, amount);
        });
        it("Should verify contract's balance after recovery", async function () {
            const initialBalance = await mockFeeToken.balanceOf(testMessageClient.address);
            const amount = hardhat_1.ethers.utils.parseEther("50");
            await testMessageClient.recoverToken(mockFeeToken.address, amount);
            const finalBalance = await mockFeeToken.balanceOf(testMessageClient.address);
            (0, chai_1.expect)(finalBalance).to.equal(initialBalance.sub(amount));
        });
    });
});
