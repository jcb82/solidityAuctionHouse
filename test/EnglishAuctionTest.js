const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("EnglishAuctionTest", function () {
    async function deployFixture() {
        const addressZero = ethers.constants.AddressZero;
        const initialPrice = 300;
        const biddingPeriod = 10;
        const minimumPriceIncrement = 20;

        const [owner, alice, bob, carol] = await ethers.getSigners();
        const Timer = await ethers.getContractFactory("Timer");
        const timer = await Timer.deploy(0);
        const EnglishAuction = await ethers.getContractFactory("EnglishAuction");
        const eA = await EnglishAuction.deploy(owner.address, addressZero, timer.address, initialPrice, biddingPeriod, minimumPriceIncrement);

        return { timer, eA, alice, bob, carol };
    }

    it("Low bids should be rejected", async function () {
        const { timer, eA, alice } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 0 })).to.be.reverted;
        await timer.setTime(9);
        await expect(eA.connect(alice).bid({ value: 299 })).to.be.reverted;
    });

    it("Single valid bid should succeed", async function () {
        const { timer, eA, alice } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(10);
        expect(await eA.getWinner()).to.equal(alice.address);
    });

    it("No winner should be declared before deadline", async function () {
        const { timer, eA, alice } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(9);
        expect(await eA.getWinner()).to.equal(ethers.constants.AddressZero);
    });

    it("Low following bids should be rejected", async function () {
        const { timer, eA, alice, bob } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(9);
        await expect(eA.connect(bob).bid({ value: 319 })).to.be.reverted;
        await timer.setTime(7);
        await expect(eA.connect(bob).bid({ value: 250 })).to.be.reverted;
    });

    it("Refund after getting outbid should work properly", async function () {
        const { timer, eA, alice, bob } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(8);
        await expect(eA.connect(bob).bid({ value: 320 })).to.changeEtherBalance(eA, 320);
        expect(await ethers.provider.getBalance(eA.address)).to.equal(620);
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalances([eA, alice], [-300, 300]);
    });

    it("Late bids should be rejected", async function () {
        const { timer, eA, alice, bob, carol } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(10);
        await expect(eA.connect(bob).bid({ value: 320 })).to.be.reverted;
        await timer.setTime(12);
        await expect(eA.connect(carol).bid({ value: 500 })).to.be.reverted;
    });

    it("Second valid bid should be accepted", async function () {
        const { timer, eA, alice } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(5);
        await expect(eA.connect(alice).bid({ value: 350 })).to.changeEtherBalance(eA, 350);
        await timer.setTime(14);
        expect(await eA.getWinner()).to.equal(ethers.constants.AddressZero);
        await timer.setTime(15);
        expect(await eA.getWinner()).to.equal(alice.address);
        expect(await ethers.provider.getBalance(eA.address)).to.equal(650);
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalances([eA, alice], [-300, 300]);
    });

    it("Extended bidding should work as intended", async function () {
        const { timer, eA, alice, bob, carol } = await loadFixture(deployFixture);

        await timer.setTime(0);
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await timer.setTime(4);
        await expect(eA.connect(bob).bid({ value: 310 })).to.be.reverted;
        await timer.setTime(8);
        await expect(eA.connect(carol).bid({ value: 400 })).to.changeEtherBalance(eA, 400);
        await timer.setTime(12);
        await expect(eA.connect(bob).bid({ value: 450 })).to.changeEtherBalance(eA, 450);
        await timer.setTime(15);
        await expect(eA.connect(alice).bid({ value: 650 })).to.changeEtherBalance(eA, 650);
        await timer.setTime(16);
        await expect(eA.connect(bob).bid({ value: 660 })).to.be.reverted;
        await timer.setTime(20);
        await expect(eA.connect(alice).bid({ value: 750 })).to.changeEtherBalance(eA, 750);
        await timer.setTime(29);
        await expect(eA.connect(carol).bid({ value: 1337 })).to.changeEtherBalance(eA, 1337);
        await timer.setTime(38);
        expect(await eA.getWinner()).to.equal(ethers.constants.AddressZero);
        await timer.setTime(39);
        expect(await eA.getWinner()).to.equal(carol.address);
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1700);
        await expect(eA.connect(bob).withdraw()).to.changeEtherBalance(bob, 450);
        await expect(eA.connect(carol).withdraw()).to.changeEtherBalance(carol, 400);
        expect(await ethers.provider.getBalance(eA.address)).to.equal(1337);
    });
});
