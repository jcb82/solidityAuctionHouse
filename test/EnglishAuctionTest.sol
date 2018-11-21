pragma solidity ^0.4.18;

import "./TestFramework.sol";
import "./Bidders.sol";

contract EnglishAuctionTest {

    EnglishAuction testAuction;
    EnglishAuctionBidder alice;
    EnglishAuctionBidder bob;
    EnglishAuctionBidder carol;

    Timer t;

    // Adjust this to change the test code's initial balance
    uint public initialBalance = 1000000000 wei;

    //can receive money
    function() public payable {}
    constructor() public payable {}

    function setupContracts() public {
        t = new Timer(0);
        testAuction = new EnglishAuction(this, 0, t, 300, 10, 20);
        alice = new EnglishAuctionBidder(testAuction);
        bob = new EnglishAuctionBidder(testAuction);
        carol = new EnglishAuctionBidder(testAuction);
    }

    function makeBid(EnglishAuctionBidder bidder,
                     uint bidValue, 
                     uint bidTime,
                     bool expectedResult,
                     string message) internal {

        uint oldTime = t.getTime();
        uint oldBalance = address(testAuction).balance;
        t.setTime(bidTime);
        address(bidder).transfer(bidValue);
        bool result = bidder.bid(bidValue);

        if (expectedResult == false) {
            Assert.isFalse(result, message);
        }
        else {
            Assert.isTrue(result, message);
            Assert.equal(address(testAuction).balance - oldBalance, bidValue, "auction should retain bid amount");
        }
        t.setTime(oldTime);
    }

    function testCreateEnglishAuction() public {
        setupContracts();
        //do nothing, just verify that the constructor actually ran
    }

    function testLowInitialBids() public {
        setupContracts();
        makeBid(alice, 0, 0, false, "low bid should be rejected");
        makeBid(alice, 299, 9, false, "low bid should be rejected");
    }


    function testSingleValidBid() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        t.setTime(10);
        Assert.equal(testAuction.getWinner(), address(alice), "single bidder should be declared the winner");
    }

    function testEarlyWinner() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        t.setTime(9);
        Assert.equal(testAuction.getWinner(), 0, "no bidder should be declared before deadline");
    }

    function testLowFollowupBids() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        makeBid(bob, 319, 9, false, "low bid should be rejected");
        makeBid(bob, 250, 7, false, "low bid should be rejected");
    }

    function testRefundAfterOutbid() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        makeBid(bob, 320, 8, true, "valid bid should be accepted");

        Assert.equal(address(bob).balance, 0, "bidder should not retain funds");
        Assert.equal(address(testAuction).balance, 620, "auction should retain bidders' funds in escrow");
        Assert.equal(address(alice).balance, 0, "outbid bidder should not receive early refund");
        alice.callWithdraw();
        Assert.equal(address(alice).balance, 300, "outbid bidder should be able to withdraw refund");
    }

    function testLateBids() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        makeBid(bob, 320, 10, false, "late bid should be rejected");
        makeBid(carol, 500, 12, false, "late bid should be rejected");
    }

    function testIncreaseBid() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        makeBid(alice, 350, 5, true, "second valid bid should be accepted");
        t.setTime(14);
        Assert.equal(testAuction.getWinner(), 0, "no bidder should be declared before deadline");
        t.setTime(15);
        Assert.equal(testAuction.getWinner(), address(alice), "repeat bidder should be declared the winner");
        Assert.equal(address(alice).balance, 0, "bidder should not retain funds");
        Assert.equal(address(testAuction).balance, 650, "auction should retain bidder's funds in escrow");
        alice.callWithdraw();
        Assert.equal(address(alice).balance, 300, "outbid bidder should be able to withdraw funds");
        Assert.equal(address(testAuction).balance, 350, "auction should retain bidder's funds in escrow");
    }

    function testExtendedBidding() public {
        setupContracts();
        makeBid(alice, 300, 0, true, "valid bid should be accepted");
        makeBid(bob, 310, 4, false, "invalid bid should be rejected");
        makeBid(carol, 400, 8, true, "valid bid should be accepted");
        makeBid(bob, 450, 12, true, "valid bid should be accepted");
        makeBid(alice, 650, 15, true, "valid bid should be accepted");
        makeBid(bob, 660, 16, false, "invalid bid should be rejected");
        makeBid(alice, 750, 20, true, "valid bid should be accepted");
        makeBid(carol, 1337, 29, true, "valid bid should be accepted");
        t.setTime(38);
        Assert.equal(testAuction.getWinner(), 0, "no bidder should be declared before deadline");
        t.setTime(39);
        Assert.equal(testAuction.getWinner(), address(carol), "final bidder should be declared the winner");

        Assert.equal(address(alice).balance, 0, "bidders should not retain funds");
        Assert.equal(address(bob).balance, 970, "bidders should not retain funds");
        Assert.equal(address(carol).balance, 0, "bidders should not retain funds");

        alice.callWithdraw();
        bob.callWithdraw();
        carol.callWithdraw();
        Assert.equal(address(carol).balance, 400, "bidders should get valid refunds");
        Assert.equal(address(bob).balance, 1420, "bidders should get valid refunds");
        Assert.equal(address(alice).balance, 1700, "bidders should get valid refunds");

        Assert.equal(address(testAuction).balance, 1337, "auction should retain bidder's funds in escrow");
    }

}
