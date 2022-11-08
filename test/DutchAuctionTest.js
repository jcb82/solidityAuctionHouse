const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("DutchAuctionTest", function () {
    async function deployFixture() {
        const addressZero = ethers.constants.AddressZero;
        const initialPrice = 300;
        const biddingPeriod = 10;
        const offerPriceDecrement = 20;

        const [owner, bidder] = await ethers.getSigners();
        const Timer = await ethers.getContractFactory("Timer");
        const timer = await Timer.deploy(0);
        const DutchAuction = await ethers.getContractFactory("DutchAuction");
        const dA = await DutchAuction.deploy(owner.address, addressZero, timer.address, initialPrice, biddingPeriod, offerPriceDecrement);

        return { timer, dA, bidder };
    }

    it("Low bids should be rejected", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(dA.connect(bidder).bid({ value: 299 })).to.be.reverted;
        await timer.setTime(2);
        await expect(dA.connect(bidder).bid({ value: 240 })).to.be.reverted;
        await timer.setTime(5);
        await expect(dA.connect(bidder).bid({ value: 100 })).to.be.reverted;
    });

    it("Exact bid should be accepted 1", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 300;
        const expectedPrice = 300;

        await timer.setTime(0);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Exact bid should be accepted 2", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 280;
        const expectedPrice = 280;

        await timer.setTime(1);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Exact bid should be accepted 3", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 120;
        const expectedPrice = 120;

        await timer.setTime(9);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Valid bid after an invalid bid should succeed", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 300;
        const expectedPrice = 300;

        await timer.setTime(0);
        await expect(dA.connect(bidder).bid({ value: 299 })).to.be.reverted;
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });

    it("Late bid should be rejected", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);

        await timer.setTime(10);
        await expect(dA.connect(bidder).bid({ value: 300 })).to.be.reverted;
    });

    it("Second valid bid after a first valid bid should be rejected", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 280;
        const expectedPrice = 280;

        await timer.setTime(1);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
        await timer.setTime(0);
        await expect(dA.connect(bidder).bid({ value: 300 })).to.be.reverted;
    });

    it("A high bid should be partially refunded properly", async function () {
        const { timer, dA, bidder } = await loadFixture(deployFixture);
        const bidValue = 300;
        const expectedPrice = 260;

        await timer.setTime(2);
        await expect(dA.connect(bidder).bid({ value: bidValue })).to.changeEtherBalance(bidder, -bidValue);
        await expect(dA.connect(bidder).withdraw()).to.changeEtherBalance(bidder, bidValue - expectedPrice);
        expect(await ethers.provider.getBalance(dA.address)).to.equal(expectedPrice);
        expect(await dA.getWinner()).to.equal(bidder.address);
    });
});
