const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { mineUpTo } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("EnglishAuctionTest", function () {
    async function deployFixture() {
        const initialPrice = 300;
        const biddingPeriod = 10;
        const minimumPriceIncrement = 20;

        const [owner, alice, bob, carol] = await ethers.getSigners();

        const EnglishAuction = await ethers.getContractFactory("EnglishAuction");
        const eA = await EnglishAuction.deploy(await owner.getAddress(), ethers.ZeroAddress, initialPrice, biddingPeriod, minimumPriceIncrement);

        return { eA, alice, bob, carol };
    }

    async function getBalance(signer) {
        return await signer.runner.provider.getBalance(signer.getAddress());
    }

    it("Low bids should be rejected", async function () {
        const { eA, alice } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();

        await expect(eA.connect(alice).bid({ value: 0 })).to.be.reverted;
        await mineUpTo(startBlock + 8);
        await expect(eA.connect(alice).bid({ value: 299 })).to.be.reverted;
    });

    it("Single valid bid should succeed", async function () {
        const { eA, alice } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
                
        await mineUpTo(startBlock + 11);
        expect(await eA.getWinner()).to.equal(await alice.getAddress());
    });

    it("No winner should be declared before deadline", async function () {
        const { eA, alice } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        expect(await eA.getWinner()).to.equal(ethers.ZeroAddress);
                
        await mineUpTo(startBlock + 10);
        expect(await eA.getWinner()).to.equal(ethers.ZeroAddress);
    });

    it("Low following bids should be rejected", async function () {
        const { eA, alice, bob } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await mineUpTo(startBlock + 8);
        await expect(eA.connect(bob).bid({ value: 319 })).to.be.reverted;
        await mineUpTo(startBlock + 11);
        await expect(eA.connect(bob).bid({ value: 250 })).to.be.reverted;
    });

    it("Refund after getting outbid should work properly", async function () {
        const { eA, alice, bob } = await loadFixture(deployFixture);

        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await expect(eA.connect(bob).bid({ value: 320 })).to.changeEtherBalance(eA, 320);
        expect(await getBalance(eA)).to.equal(620);
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalances([eA, alice], [-300, 300]);
    });

    it("Late bids should be rejected", async function () {
        const { eA, alice, bob, carol } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await mineUpTo(startBlock + 11);
        await expect(eA.connect(bob).bid({ value: 320 })).to.be.reverted;
        await mineUpTo(startBlock + 13);
        await expect(eA.connect(carol).bid({ value: 500 })).to.be.reverted;
    });

    it("Second valid bid should be accepted", async function () {
        const { eA, alice } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await mineUpTo(startBlock + 4);
        await expect(eA.connect(alice).bid({ value: 350 })).to.changeEtherBalance(eA, 350);
        await mineUpTo(startBlock + 13);
        expect(await eA.getWinner()).to.equal(ethers.ZeroAddress);
        await mineUpTo(startBlock + 15);
        expect(await eA.getWinner()).to.equal(await alice.getAddress());
        expect(await getBalance(eA)).to.equal(650);
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalances([eA, alice], [-300, 300]);
    });

    it("Extended bidding should work as intended", async function () {
        const { eA, alice, bob, carol } = await loadFixture(deployFixture);
        const startBlock = await time.latestBlock();
        
        await expect(eA.connect(alice).bid({ value: 300 })).to.changeEtherBalance(eA, 300);
        await mineUpTo(startBlock + 3);
        await expect(eA.connect(bob).bid({ value: 310 })).to.be.reverted;
        await mineUpTo(startBlock + 7);
        await expect(eA.connect(carol).bid({ value: 400 })).to.changeEtherBalance(eA, 400);
        await mineUpTo(startBlock + 11);
        await expect(eA.connect(bob).bid({ value: 450 })).to.changeEtherBalance(eA, 450);
        await mineUpTo(startBlock + 14);
        await expect(eA.connect(alice).bid({ value: 650 })).to.changeEtherBalance(eA, 650);
        await expect(eA.connect(bob).bid({ value: 660 })).to.be.reverted;
        await mineUpTo(startBlock + 19);
        await expect(eA.connect(alice).bid({ value: 750 })).to.changeEtherBalance(eA, 750);
        await mineUpTo(startBlock + 28);
        await expect(eA.connect(carol).bid({ value: 1337 })).to.changeEtherBalance(eA, 1337);
        await mineUpTo(startBlock + 37);
        expect(await eA.getWinner()).to.equal(ethers.ZeroAddress);
        await mineUpTo(startBlock + 39);
        expect(await eA.getWinner()).to.equal(await carol.getAddress());
        await expect(eA.connect(alice).withdraw()).to.changeEtherBalance(alice, 1700);
        await expect(eA.connect(bob).withdraw()).to.changeEtherBalance(bob, 450);
        await expect(eA.connect(carol).withdraw()).to.changeEtherBalance(carol, 400);
        expect(await getBalance(eA)).to.equal(1337);
    });
});
