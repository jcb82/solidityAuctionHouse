pragma solidity ^0.4.18;

import "./TestFramework.sol";

contract VickreyAuctionBidder {

    VickreyAuction auction;
    bytes32 nonce;

    function VickreyAuctionBidder(VickreyAuction _auction, bytes32 _nonce) public {
        auction = _auction;
        nonce = _nonce;
    }

    function setNonce(bytes32 _newNonce) public {
        nonce = _newNonce;
    }

    //wrapped call
    function commitBid(uint _bidValue) public returns (bool success) {
      success = commitBid(_bidValue, auction.bidDepositAmount());
    }

    //wrapped call
    function commitBid(uint _bidValue, uint _depositValue) public returns (bool success) {
      bytes32 commitment = keccak256(_bidValue, nonce);
      success = auction.call.value(_depositValue).gas(200000)(bytes4 (keccak256("commitBid(bytes32)")), commitment);
    }

    //wrapped call
    function revealBid(uint _bidValue) public returns (bool success) {
      success = auction.call.value(_bidValue).gas(200000)(bytes4 (keccak256("revealBid(bytes32)")), nonce);
    }

    //can receive money
    function() public payable{}
}

contract VickreyAuctionTestBasic {

    VickreyAuction testAuction;
    VickreyAuctionBidder alice;
    VickreyAuctionBidder bob;
    VickreyAuctionBidder carol;
    uint bidderCounter;

    Timer t;

    // Adjust this to change the test code's initial balance
    uint public initialBalance = 1000000000 wei;

    function VickreyAuctionTestBasic() public {
        t = new Timer(0);
        alice = new VickreyAuctionBidder(testAuction, 1);
        bob = new VickreyAuctionBidder(testAuction, 2);
        carol = new VickreyAuctionBidder(testAuction, 3);
    }

    function() public payable {}

    function setupContracts() public {
        t = new Timer(0);
        testAuction = new VickreyAuction(this, 0, t, 300, 10, 10, 1000);
        bidderCounter += 1;
        alice = new VickreyAuctionBidder(testAuction, bytes32(bidderCounter));
        bob = new VickreyAuctionBidder(testAuction, bytes32(bidderCounter));
        carol = new VickreyAuctionBidder(testAuction, bytes32(bidderCounter));
    }

    function commitBid(VickreyAuctionBidder bidder,
                     uint bidValue, 
                     uint bidTime,
                     bool expectedResult,
                     string message) public {

        uint oldTime = t.getTime();
        t.setTime(bidTime);
        uint initialAuctionBalance = testAuction.balance;

        bidder.transfer(testAuction.bidDepositAmount());
        bool result = bidder.commitBid(bidValue);

        if (expectedResult == false) {
            Assert.isFalse(result, message);
        }
        else {
            Assert.isTrue(result, message);
            Assert.equal(testAuction.balance, initialAuctionBalance + testAuction.bidDepositAmount(), "auction should retain deposit");
        }
        t.setTime(oldTime);
    }

    function revealBid(VickreyAuctionBidder bidder,
                     uint bidValue, 
                     uint bidTime,
                     bool expectedResult,
                     string message) public {

        uint oldTime = t.getTime();
        t.setTime(bidTime);

        bidder.transfer(bidValue);
        bool result = bidder.revealBid(bidValue);

        if (expectedResult == false) {
            Assert.isFalse(result, message);
        }
        else {
            Assert.isTrue(result, message);
        }
        t.setTime(oldTime);
    }


    function testCreateVickreyAuction() public {
        setupContracts();
        //do nothing, just verify that the constructor actually ran
    }

    function testCommitBids() public {
        setupContracts();
        commitBid(alice, 10, 1, true, "valid bid commitment should be accepted");
        commitBid(bob, 1000, 2, true, "valid bid commitment should be accepted");
        commitBid(carol, 340, 7, true, "valid bid commitment should be accepted");
    }

    function testLateBidCommitments() public {
        setupContracts();
        commitBid(carol, 340, 7, true, "valid bid commitment should be accepted");
        commitBid(alice, 300, 10, false, "late bid commitment should be rejected");
        commitBid(bob, 3000, 100, false, "late bid commitment should be rejected");
    }

    function testExcessBidDeposit() public {
        setupContracts();
        alice.transfer(1067);
        Assert.isTrue(alice.commitBid(1000, 1067), "bid with excess deposit should be accepted");
        Assert.equal(alice.balance, 67, "bid with excess deposit should be partially refunded");
        Assert.equal(testAuction.balance, 1000, "bid with excess deposit should be retain exact deposit");
    }

    function testChangeBidCommitmentRefund() public {
        setupContracts();
        alice.transfer(2548);
        Assert.isTrue(alice.commitBid(500, 1000), "valid bid should be accepted");
        t.setTime(1);
        Assert.isTrue(alice.commitBid(550, 1097), "valid bid change #1 should be accepted");
        t.setTime(2);
        Assert.isTrue(alice.commitBid(450, 401), "valid bid #2 change should be accepted");
        t.setTime(3);
        Assert.isTrue(alice.commitBid(600, 0), "valid bid #3 change should be accepted");

        Assert.equal(testAuction.balance, 1000, "bid changes should still capture deposit");
        Assert.equal(alice.balance, 1548, "bid changes should not capture additional deposit");
    }

    function testEarlyReveal() public {
        setupContracts();
        commitBid(alice, 340, 7, true, "valid bid commitment should be accepted");
        revealBid(alice, 340, 9, false, "early bid reveal should be rejected");
    }

    function testLateReveal() public {
        setupContracts();
        commitBid(alice, 340, 7, true, "valid bid commitment should be accepted");
        revealBid(alice, 340, 20, false, "early bid reveal should be rejected");
    }

    function testInvalidReveal() public {
        setupContracts();
        commitBid(alice, 340, 7, true, "valid bid commitment should be accepted");
        commitBid(bob, 380, 8, true, "valid bid commitment should be accepted");
        revealBid(alice, 320, 14, false, "incorrect bid reveal should be rejected");
        bob.setNonce(1);
        revealBid(bob, 380, 16, false, "incorrect bid reveal should be rejected");
    }

}
