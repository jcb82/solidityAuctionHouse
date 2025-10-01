const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const winningPrice = 100;

describe("ArbitrationTest", function () {
    async function deployFixture() {

        // Create addresses
        const [owner, seller, winner, judge, minter, other] = await ethers.getSigners();

        // Create NFT contract
        const NFTFactory = await ethers.getContractFactory("CatToken");
        const nftContract = await NFTFactory.deploy(await minter.getAddress());
     
        // Create auction contract
        const AuctionFactory = await ethers.getContractFactory("DummyAuction");
        const auctionContract = await AuctionFactory.deploy(await seller.getAddress()); 
        
        return {auctionContract, nftContract, winningPrice, owner, seller, judge, winner, other, minter};
    }
    
    describe("Basic auction functionality", function () {
    
    
        it("Contracts compiled and deployed", async function () {
            const { auctionContract } = await loadFixture(deployFixture);
            expect(1 + 1).to.equal(2);
        });
        
        it("Early finalize()", async function () {
            const { auctionContract, judge, seller, winner, other } = await loadFixture(deployFixture);
            //await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;

            await expect(auctionContract.connect(seller).finalize()).to.be.reverted;
            await expect(auctionContract.connect(other).finalize()).to.be.reverted;
            await expect(auctionContract.connect(winner).finalize()).to.be.reverted;
            await expect(auctionContract.connect(judge).finalize()).to.be.reverted;
        });
        
        it("Early withdraw()", async function () {
            const { auctionContract, other, seller, judge, winner } = await loadFixture(deployFixture);

            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(winner, 0);
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(other).withdraw()).to.changeEtherBalance(other, 0);
            await expect(auctionContract.connect(judge).withdraw()).to.changeEtherBalance(judge, 0);
        });
        
        it("Valid finalize() & seller withdraw()", async function () {
            const { auctionContract, other, seller, winner } = await loadFixture(deployFixture);
            
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(other).finalize()).not.to.be.reverted;
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(winner, 0);
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });
        
        it("Multiple withdraw() by seller", async function () {
            const { auctionContract, winner, judge, seller } = await loadFixture(deployFixture);

            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(winner).finalize()).not.to.be.reverted;
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
        });


    });
    
    describe("Refund functionality", function () {
    
        it("Valid refund() by seller", async function () {
            const { auctionContract, seller, winner } = await loadFixture(deployFixture);

            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(seller).refund()).not.to.be.reverted;
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(winner, winningPrice);

        });
    
        it("Early refund() call", async function () {
            const { auctionContract, seller } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).refund()).to.be.reverted;
        });
        
        it("Unauthorized refund()", async function () {
            const { auctionContract, other, seller, winner, judge } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(other).refund()).to.be.reverted;
            await expect(auctionContract.connect(winner).refund()).to.be.reverted;
            await expect(auctionContract.connect(judge).refund()).to.be.reverted;
        });
    
    });
   
    describe("Judge functionality", function () {

        it("Valid declareJudge()", async function () {
            const { auctionContract, judge, seller, winner, other } = await loadFixture(deployFixture);
            await expect(await auctionContract.connect(other).getJudge()).to.equal(ethers.ZeroAddress);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(await auctionContract.connect(other).getJudge()).to.equal(await judge.getAddress());
        });

        it("Unauthorized declareJudge()", async function () {
            const { auctionContract, judge, seller, winner, other } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(other).setJudge(await judge.getAddress())).to.be.reverted;
            await expect(auctionContract.connect(judge).setJudge(await judge.getAddress())).to.be.reverted;
            await expect(auctionContract.connect(winner).setJudge(await judge.getAddress())).to.be.reverted;
        });

        it("Repeated declareJudge()", async function () {
            const { auctionContract, judge, seller, winner, other } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(judge).setJudge(await other.getAddress())).to.be.reverted;
        });

        it("Early finalize() by judge", async function () {
            const { auctionContract, judge, seller } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(judge).finalize()).to.be.reverted;
        });

        it("Valid finalize() by judge", async function () {
            const { auctionContract, judge, seller, winner } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(judge).finalize()).not.to.be.reverted;
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

        it("Valid finalize() by winner, with judge", async function () {
            const { auctionContract, winner, judge, seller } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(winner).finalize()).not.to.be.reverted;
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, winningPrice);
        });

       it("Early refund() by judge", async function () {
            const { auctionContract, judge, seller } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;

            await expect(auctionContract.connect(judge).refund()).to.be.reverted;
        });

        it("Valid refund() by judge", async function () {
            const { auctionContract, seller, judge, winner } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(judge).refund()).not.to.be.reverted;
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(winner, winningPrice);
        });
        
        it("Valid refund() by seller, with judge", async function () {
            const { auctionContract, seller, judge, winner } = await loadFixture(deployFixture);
            await expect(auctionContract.connect(seller).setJudge(await judge.getAddress())).not.to.be.reverted;
            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;

            await expect(auctionContract.connect(seller).refund()).not.to.be.reverted;
            await expect(auctionContract.connect(seller).withdraw()).to.changeEtherBalance(seller, 0);
            await expect(auctionContract.connect(winner).withdraw()).to.changeEtherBalance(winner, winningPrice);

        });
    });
    
    
    describe("NFT functionality", function () {

        it("Auction contract can receive NFTs", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
            await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).not.to.be.reverted;
            
            const tokenID = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Marmalade", "orange");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Marmalade", "orange")).not.to.be.reverted;

            await expect(await nftContract.connect(other).ownerOf(tokenID)).to.equal(await auctionContract.getAddress());
            
        });
        
        it("Unauthorized setNFTContract()", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
            await expect(auctionContract.connect(other).setNFTContract(await nftContract.getAddress())).to.be.reverted;
            
        });
        
        it("Multiple setNFTContract() calls", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
            await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).not.to.be.reverted;
            
            await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).to.be.reverted;
            
        });
        
        it("Auction contract rejects NFTs before contract assigned", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
            //const tokenID = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Marmalade", "orange");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Marmalade", "orange")).to.be.reverted;

           await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).not.to.be.reverted;

            const tokenID = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Marmalade", "orange");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Marmalade", "orange")).not.to.be.reverted;


            await expect(await nftContract.connect(other).ownerOf(tokenID)).to.equal(await auctionContract.getAddress());
            
        });
        
        it("NFTs transferred to winner on finalize()", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
           await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).not.to.be.reverted;
            
            const tokenID1 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Marmalade", "orange");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Marmalade", "orange")).not.to.be.reverted;
            
            const tokenID2 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Fletcher", "tabby");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Cinnamon", "brown")).not.to.be.reverted;
            
            // not auctioned off
            const tokenID3 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Issho", "tuxedo");
            await expect(nftContract.connect(minter).mint(await other.getAddress(), "Cinnamon", "brown")).not.to.be.reverted;
            
            const tokenID4 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Josie", "calico");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Josie", "calico")).not.to.be.reverted;

            await expect(await nftContract.connect(other).ownerOf(tokenID1)).to.equal(await auctionContract.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID2)).to.equal(await auctionContract.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID3)).to.equal(await other.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID4)).to.equal(await auctionContract.getAddress());

            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;
            await expect(auctionContract.connect(other).finalize()).not.to.be.reverted;
            
            await expect(await nftContract.connect(other).ownerOf(tokenID1)).to.equal(await winner.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID2)).to.equal(await winner.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID3)).to.equal(await other.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID4)).to.equal(await winner.getAddress());
            
        });
        
        it("NFTs transferred to seller on refund()", async function () {
            const { auctionContract, nftContract, minter, judge, seller, winner, other } = await loadFixture(deployFixture);
            
           await expect(auctionContract.connect(seller).setNFTContract(await nftContract.getAddress())).not.to.be.reverted;
            
            const tokenID1 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Flick", "gray");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Flick", "gray")).not.to.be.reverted;
            
            const tokenID2 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Mimi", "tabby");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Mimi", "tabby")).not.to.be.reverted;
            
            // not auctioned off
            const tokenID3 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Happy", "black");
            await expect(nftContract.connect(minter).mint(await other.getAddress(), "Happy", "black")).not.to.be.reverted;
            
            const tokenID4 = await nftContract.connect(minter).mint.staticCall(await auctionContract.getAddress(), "Rosie", "calico");
            await expect(nftContract.connect(minter).mint(await auctionContract.getAddress(), "Rosie", "calico")).not.to.be.reverted;

            await expect(await nftContract.connect(other).ownerOf(tokenID1)).to.equal(await auctionContract.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID2)).to.equal(await auctionContract.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID3)).to.equal(await other.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID4)).to.equal(await auctionContract.getAddress());

            await expect(auctionContract.connect(seller).declareWinner(await winner.getAddress(), winningPrice, {value: winningPrice})).not.to.be.reverted;
            await expect(auctionContract.connect(seller).refund()).not.to.be.reverted;
            
            await expect(await nftContract.connect(other).ownerOf(tokenID1)).to.equal(await seller.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID2)).to.equal(await seller.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID3)).to.equal(await other.getAddress());
            await expect(await nftContract.connect(other).ownerOf(tokenID4)).to.equal(await seller.getAddress());
            
        });
        
    });
});
