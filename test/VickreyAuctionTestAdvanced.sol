pragma solidity ^0.4.18;

import "./TestFramework.sol";
import "./Bidders.sol";

contract VickreyAuctionTestAdvanced {

    VickreyAuction testAuction;
    VickreyAuctionBidder alice;
    VickreyAuctionBidder bob;
    VickreyAuctionBidder carol;
    uint bidderCounter;

    Timer t;

    // Adjust this to change the test code's initial balance
    uint public initialBalance = 1000000000 wei;

    //can receive money
    function() public payable {}
    constructor() public payable {}

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
                     string message) internal {

        uint oldTime = t.getTime();
        t.setTime(bidTime);
        uint initialAuctionBalance = address(testAuction).balance;

        address(bidder).transfer(testAuction.bidDepositAmount());
        bool result = bidder.commitBid(bidValue);

        if (expectedResult == false) {
            Assert.isFalse(result, message);
        }
        else {
            Assert.isTrue(result, message);
            Assert.equal(address(testAuction).balance, initialAuctionBalance + testAuction.bidDepositAmount(), "auction should retain deposit");
        }
        t.setTime(oldTime);
    }

    function revealBid(VickreyAuctionBidder bidder,
                     uint bidValue, 
                     uint bidTime,
                     bool expectedResult,
                     string message) internal {

        uint oldTime = t.getTime();
        t.setTime(bidTime);

        address(bidder).transfer(bidValue);
        bool result = bidder.revealBid(bidValue);

        if (expectedResult == false) {
            Assert.isFalse(result, message);
        }
        else {
            Assert.isTrue(result, message);
        }
        t.setTime(oldTime);
    }

    function testMinimalBidder() public {
        setupContracts();

        commitBid(bob, 300, 9, true, "valid bid commitment should be accepted");
        revealBid(bob, 300, 19, true, "valid bid reveal should be accepted");
        t.setTime(20);
        Assert.equal(address(bob), testAuction.getWinner(), "winner should be declared after auction end");
        testAuction.finalize();
        Assert.equal(address(bob).balance, 0, "winner should not receive early refund");
        bob.callWithdraw();
        Assert.equal(address(bob).balance, 1000, "winner should received partial refund");
    }

    function testRevealChangedBid() public {
        setupContracts();

        address(alice).transfer(2548);
        Assert.isTrue(alice.commitBid(500, 1000), "valid bid should be accepted");
        t.setTime(1);
        Assert.isTrue(alice.commitBid(550, 0), "valid bid change should be accepted");

        revealBid(alice, 500, 14, false, "incorrect bid reveal should be rejected");
        revealBid(alice, 550, 14, true, "correct bid reveal should be accepted");
        t.setTime(20);
        Assert.equal(address(alice), testAuction.getWinner(), "winner should be declared after auction end");
        testAuction.finalize();
        Assert.equal(address(alice).balance, 2048, "winner should not receive early refund");
        alice.callWithdraw();
        Assert.equal(address(alice).balance, 3298, "winner should received partial refund");
    }

    function testMultipleBiddersOne() public {
        setupContracts();

        commitBid(alice, 500, 1, true, "correct bid should be accepted");
        commitBid(bob, 617, 2, true, "correct bid should be accepted");
        commitBid(carol, 650, 3, true, "correct bid should be accepted");

        revealBid(alice, 500, 14, true, "correct bid reveal should be accepted");
        revealBid(bob, 617, 15, true, "correct bid reveal should be accepted");
        revealBid(carol, 650, 16, true, "correct bid reveal should be accepted");

        t.setTime(20);
        Assert.equal(address(carol), testAuction.getWinner(), "winner should be declared after auction end");
        testAuction.finalize();
        
        alice.callWithdraw();
        bob.callWithdraw();
        carol.callWithdraw();

        Assert.equal(address(alice).balance, 1500, "loser should received full refund");
        Assert.equal(address(bob).balance, 1617, "loser should received full refund");
        Assert.equal(address(carol).balance, 1033, "winner should received partial refund");
    }

    function testMultipleBiddersTwo() public {
        setupContracts();

        commitBid(alice, 500, 1, true, "correct bid should be accepted");
        commitBid(bob, 617, 2, true, "correct bid should be accepted");
        commitBid(carol, 650, 3, true, "correct bid reveal should be accepted");

        revealBid(carol, 650, 14, true, "correct bid reveal should be accepted");
        revealBid(alice, 500, 15, true, "correct bid reveal should be accepted");
        revealBid(bob, 617, 16, true, "correct bid reveal should be accepted");

        t.setTime(20);

        Assert.equal(address(carol), testAuction.getWinner(), "winner should be declared after auction end");
        testAuction.finalize();

        alice.callWithdraw();
        bob.callWithdraw();
        carol.callWithdraw();

        Assert.equal(address(alice).balance, 1500, "loser should received full refund");
        Assert.equal(address(bob).balance, 1617, "loser should received full refund");
        Assert.equal(address(carol).balance, 1033, "winner should received partial refund");
    }
}
