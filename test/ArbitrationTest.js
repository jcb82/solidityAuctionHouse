const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("ArbitrationTest", function () {
    async function noWinnerYesJudgeFixture() {
        const winningPrice = 100;

        const [owner, seller, judge, winner, other] = await ethers.getSigners();
        const Auction = await ethers.getContractFactory("Auction");
        const auction = await Auction.deploy(await seller.getAddress(), await judge.getAddress(), ethers.ZeroAddress, winningPrice, { value: winningPrice });
        
        return { auction, winningPrice, owner, seller, judge, winner, other };
    }

    async function yesWinnerNoJudgeFixture() {
        const winningPrice = 100;

        const [owner, seller, judge, winner, other] = await ethers.getSigners();
        const Auction = await ethers.getContractFactory("Auction");
        const auction = await Auction.deploy(await seller.getAddress(), ethers.ZeroAddress, await winner.getAddress(), winningPrice, { value: winningPrice });

        return { auction, winningPrice, owner, seller, judge, winner, other };
    }

    async function yesWinnerYesJudgeFixture() {
        const winningPrice = 100;

        const [owner, seller, judge, winner, other] = await ethers.getSigners();
        const Auction = await ethers.getContractFactory("Auction");
        const auction = await Auction.deploy(await seller.getAddress(), await judge.getAddress(), await winner.getAddress(), winningPrice, { value: winningPrice });

        return { auction, winningPrice, owner, seller, judge, winner, other };
    }

    describe("No Winner, Yes Judge", function () {
        it("This test should never fail", async function () {
            const { auction } = await loadFixture(noWinnerYesJudgeFixture);

            expect(1 + 1).to.equal(2);
        });

        it("Judge shouldn't be able to finalize early", async function () {
            const { auction, judge } = await loadFixture(noWinnerYesJudgeFixture);

            await expect(auction.connect(judge).finalize()).to.be.reverted;
        });

        it("Judge shouldn't be able to refund early", async function () {
            const { auction, judge } = await loadFixture(noWinnerYesJudgeFixture);

            await expect(auction.connect(judge).refund()).to.be.reverted;
        });
    });

    describe("Yes Winner, No Judge", function () {
        it("Unauthorized refund call should be rejected", async function () {
            const { auction, judge } = await loadFixture(yesWinnerNoJudgeFixture);

            await expect(auction.connect(judge).refund()).to.be.reverted;
        });

        it("Public should be able to finalize & seller should be able to withdraw", async function () {
            const { auction, other, seller, winningPrice } = await loadFixture(yesWinnerNoJudgeFixture);

            await expect(auction.connect(other).finalize()).not.to.be.reverted;
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

        it("Seller should be able to refund", async function () {
            const { auction, seller, winner, winningPrice } = await loadFixture(yesWinnerNoJudgeFixture);

            await expect(auction.connect(seller).refund()).not.to.be.reverted;
            await expect(auction.connect(winner).withdraw()).to.changeEtherBalance(winner, winningPrice);
        });
    });

    describe("Yes Winner, Yes Judge", function () {
        it("Unauthorized refund call should be rejected", async function () {
            const { auction, winner, other } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(winner).refund()).to.be.reverted;
            await expect(auction.connect(other).refund()).to.be.reverted;
        });

        it("Unauthorized finalize call should be rejected", async function () {
            const { auction, seller, other } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(seller).finalize()).to.be.reverted;
            await expect(auction.connect(other).finalize()).to.be.reverted;
        });

        it("Judge should be able to finalize & seller should be able to withdraw", async function () {
            const { auction, judge, seller, winningPrice } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(judge).finalize()).not.to.be.reverted;
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

        it("Winner should be able to finalize & seller should be able to withdraw", async function () {
            const { auction, winner, seller, winningPrice } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(winner).finalize()).not.to.be.reverted;
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

        it("Winner and seller withdraws should work as intended", async function () {
            const { auction, winner, seller, winningPrice } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(winner).withdraw()).to.changeEtherBalance(winner, 0);
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auction.connect(winner).finalize()).not.to.be.reverted;
            await expect(auction.connect(winner).withdraw()).to.changeEtherBalance(winner, 0);
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

        it("Seller should be able to withdraw only once", async function () {
            const { auction, winner, seller, winningPrice } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(winner).finalize()).not.to.be.reverted;
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
            await expect(auction.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
        });

        it("Judge should be able to refund", async function () {
            const { auction, judge, winner, winningPrice } = await loadFixture(yesWinnerYesJudgeFixture);

            await expect(auction.connect(judge).refund()).not.to.be.reverted;
            await expect(auction.connect(winner).withdraw()).to.changeEtherBalance(winner, winningPrice);
        });
    });
});
