const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("VickreyAuctionTest", function () {
    async function deployFixture() {
        const addressZero = ethers.constants.AddressZero;
        const minimumPrice = 300;
        const biddingPeriod = 10;
        const revealPeriod = 10;
        const bidDepositAmount = 1000;

        const [owner, alice, bob, carol] = await ethers.getSigners();
        const Timer = await ethers.getContractFactory("Timer");
        const timer = await Timer.deploy(0);
        const VickreyAuction = await ethers.getContractFactory("VickreyAuction");
        const vA = await VickreyAuction.deploy(owner.address, addressZero, timer.address, minimumPrice, biddingPeriod, revealPeriod, bidDepositAmount);

        return { timer, vA, alice, bob, carol };
    }

    describe("Basic", function () {
        it("Valid bid commitments should be accepted", async function () {
            const { timer, vA, alice, bob, carol } = await loadFixture(deployFixture);

            await timer.setTime(1);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [10, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(2);
            const bobBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [1000, 2]);
            await expect(vA.connect(bob).commitBid(bobBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(7);
            const carolBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [340, 3]);
            await expect(vA.connect(carol).commitBid(carolBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
        });

        it("Late bid commitments should be rejected", async function () {
            const { timer, vA, alice, bob, carol } = await loadFixture(deployFixture);

            await timer.setTime(7);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [340, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(10);
            const bobBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [300, 2]);
            await expect(vA.connect(bob).commitBid(bobBidCommitment, { value: 1000 })).to.be.reverted;
            await timer.setTime(100);
            const carolBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [3000, 3]);
            await expect(vA.connect(carol).commitBid(carolBidCommitment, { value: 1000 })).to.be.reverted;
        });

        it("Bid with excess deposit should be rejected", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);
            
            await timer.setTime(0);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [1000, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1067 })).to.be.reverted;
        });

        it("Bid commitment updates should work as intended", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);

            await timer.setTime(0);
            const aliceBidCommitment1 = ethers.utils.solidityKeccak256(["uint", "uint"], [500, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment1, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(1);
            const aliceBidCommitment2 = ethers.utils.solidityKeccak256(["uint", "uint"], [550, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment2, { value: 0 })).to.changeEtherBalance(vA, 0);
            await timer.setTime(2);
            const aliceBidCommitment3 = ethers.utils.solidityKeccak256(["uint", "uint"], [450, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment3, { value: 0 })).to.changeEtherBalance(vA, 0);
            await timer.setTime(3);
            const aliceBidCommitment4 = ethers.utils.solidityKeccak256(["uint", "uint"], [300, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment4, { value: 1000 })).to.be.reverted;
        });

        it("Early bid reveal should be rejected", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);

            await timer.setTime(7);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [340, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(9);
            await expect(vA.connect(alice).revealBid(1, { value: 340 })).to.be.reverted;
        });

        it("Late bid reveal should be rejected", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);

            await timer.setTime(7);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [340, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(20);
            await expect(vA.connect(alice).revealBid(1, { value: 340 })).to.be.reverted;
        });

        it("Incorrect bid reveals should be rejected", async function () {
            const { timer, vA, alice, bob } = await loadFixture(deployFixture);

            await timer.setTime(7);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [340, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(8);
            const bobBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [380, 2]);
            await expect(vA.connect(bob).commitBid(bobBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(14);
            await expect(vA.connect(alice).revealBid(1, { value: 320 })).to.be.reverted;
            await timer.setTime(16);
            await expect(vA.connect(bob).revealBid(1, { value: 380 })).to.be.reverted;
        });
    });

    describe("Advanced", function () {
        it("One bidder scenario should work as intended", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);

            await timer.setTime(9);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [300, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(19);
            await expect(vA.connect(alice).revealBid(1, { value: 300 })).not.to.be.reverted;
            await timer.setTime(20);
            expect(await vA.getWinner()).to.equal(alice.address);
            await expect(vA.finalize()).to.changeEtherBalance(alice, 0);
            await expect(vA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1000);
        });

        it("Correct bid reveal after update should be accepted", async function () {
            const { timer, vA, alice } = await loadFixture(deployFixture);

            await timer.setTime(0);
            const aliceBidCommitment1 = ethers.utils.solidityKeccak256(["uint", "uint"], [500, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment1, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(1);
            const aliceBidCommitment2 = ethers.utils.solidityKeccak256(["uint", "uint"], [550, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment2, { value: 0 })).to.changeEtherBalance(vA, 0);
            await timer.setTime(14);
            await expect(vA.connect(alice).revealBid(1, { value: 500 })).to.be.reverted;
            await expect(vA.connect(alice).revealBid(1, { value: 550 })).not.to.be.reverted;
            await timer.setTime(20);
            expect(await vA.getWinner()).to.equal(alice.address);
            await expect(vA.finalize()).to.changeEtherBalance(alice, 0);
            await expect(vA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1250);
        });

        it("Multiple bidders scenario should work as intended 1", async function () {
            const { timer, vA, alice, bob, carol } = await loadFixture(deployFixture);

            await timer.setTime(1);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [500, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(2);
            const bobBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [617, 2]);
            await expect(vA.connect(bob).commitBid(bobBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(3);
            const carolBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [650, 3]);
            await expect(vA.connect(carol).commitBid(carolBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(14);
            await expect(vA.connect(alice).revealBid(1, { value: 500 })).not.to.be.reverted;
            await timer.setTime(15);
            await expect(vA.connect(bob).revealBid(2, { value: 617 })).not.to.be.reverted;
            await timer.setTime(16);
            await expect(vA.connect(carol).revealBid(3, { value: 650 })).not.to.be.reverted;
            await timer.setTime(20);
            expect(await vA.getWinner()).to.equal(carol.address);
            await expect(vA.finalize()).not.to.be.reverted;
            await expect(vA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1500);
            await expect(vA.connect(bob).withdraw()).to.changeEtherBalance(bob, 1617);
            await expect(vA.connect(carol).withdraw()).to.changeEtherBalance(carol, 1033);
        });

        it("Multiple bidders scenario should work as intended 2", async function () {
            const { timer, vA, alice, bob, carol } = await loadFixture(deployFixture);

            await timer.setTime(1);
            const aliceBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [500, 1]);
            await expect(vA.connect(alice).commitBid(aliceBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(2);
            const bobBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [617, 2]);
            await expect(vA.connect(bob).commitBid(bobBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(3);
            const carolBidCommitment = ethers.utils.solidityKeccak256(["uint", "uint"], [650, 3]);
            await expect(vA.connect(carol).commitBid(carolBidCommitment, { value: 1000 })).to.changeEtherBalance(vA, 1000);
            await timer.setTime(14);
            await expect(vA.connect(carol).revealBid(3, { value: 650 })).not.to.be.reverted;
            await timer.setTime(15);
            await expect(vA.connect(alice).revealBid(1, { value: 500 })).not.to.be.reverted;
            await timer.setTime(16);
            await expect(vA.connect(bob).revealBid(2, { value: 617 })).not.to.be.reverted;
            await timer.setTime(20);
            expect(await vA.getWinner()).to.equal(carol.address);
            await expect(vA.finalize()).not.to.be.reverted;
            await expect(vA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1500);
            await expect(vA.connect(bob).withdraw()).to.changeEtherBalance(bob, 1617);
            await expect(vA.connect(carol).withdraw()).to.changeEtherBalance(carol, 1033);
        });
    });
});
