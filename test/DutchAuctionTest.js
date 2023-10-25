const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { mineUpTo } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("DutchAuctionTest", function () {
    async function deployFixture() {
        const initialPrice = 300;
        const biddingPeriod = 10;
        const offerPriceDecrement = 20;

        const [owner, bidder] = await ethers.getSigners();
        const DutchAuction = await ethers.getContractFactory("DutchAuction");

        const dA = await DutchAuction.deploy(await owner.getAddress(), ethers.ZeroAddress, initialPrice, biddingPeriod, offerPriceDecrement);
        
        return {dA, bidder };
    }
    
    async function getBalance(signer) {
        return await signer.runner.provider.getBalance(signer.getAddress());
    }

    it("Low bids should be rejected", async function () {
        const {dA, bidder } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await mineUpTo(startBlock + 1);
        await expect(dA.connect(bidder).bid({ value: 259 })).to.be.reverted;

        await mineUpTo(startBlock + 4);
        await expect(dA.connect(bidder).bid({ value: 199 })).to.be.reverted;
        
        await mineUpTo(startBlock + 8);
        await expect(dA.connect(bidder).bid({ value: 119 })).to.be.reverted;
    });

    it("Exact bid should be accepted 1", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
       
        const bidValue = 300;
        const expectedPrice = 280;

        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Exact bid should be accepted 2", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 200;
        const expectedPrice = 200;
        const startBlock = await time.latestBlock();

        await mineUpTo(startBlock + 4);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Exact bid should be accepted 3", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 120;
        const expectedPrice = 120;
        const startBlock = await time.latestBlock();

        await mineUpTo(startBlock + 8);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Valid bid after an invalid bid should succeed", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 200;
        const expectedPrice = 200;
        const startBlock = await time.latestBlock();
        
        await expect(dA.connect(bidder).bid({ value: 279})).to.be.reverted;
        
        await mineUpTo(startBlock + 4);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Late bid should be rejected", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await mineUpTo(startBlock + 9);
        await expect(dA.connect(bidder).bid({ value: 300 })).to.be.reverted;
    });

    it("Second valid bid after a first valid bid should be rejected", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 280;
        const expectedPrice = 280;

        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);

        await expect(dA.connect(bidder).bid({ value: 300 })).to.be.reverted;
    });

    it("A high bid should be partially refunded properly", async function () {
        const { dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 300;
        const expectedPrice = 260;
        const startBlock = await time.latestBlock();
        
        await mineUpTo(startBlock+1);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await getBalance(dA)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });
});
