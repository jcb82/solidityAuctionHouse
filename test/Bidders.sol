pragma solidity ^0.4.18;

import "./TestFramework.sol";

contract Bidders {}

contract Participant {

    Auction auction;
    
    function Participant(Auction _auction) public {
        setAuction(_auction);
    }

    function setAuction(Auction _auction) public {
        auction = _auction;
    }

    //wrapped call
    function callFinalize() public returns (bool success) {
      success = auction.call.gas(200000)(bytes4 (keccak256("finalize()")));
    }

    //wrapped call
    function callRefund() public returns (bool success)  {
      success = auction.call.gas(200000)(bytes4 (keccak256("refund()")));
    }

    //can receive money
    function() public payable {}
}


contract DutchAuctionBidder {

    DutchAuction auction;

    function DutchAuctionBidder(DutchAuction _auction) public {
        auction = _auction;
    }

    //wrapped call
    function bid(uint bidValue) public returns (bool success){
      success = auction.call.value(bidValue).gas(200000)(bytes4 (keccak256("bid()")));
    }

    //can receive money
    function() public payable{}
}

contract EnglishAuctionBidder {

    EnglishAuction auction;

    function EnglishAuctionBidder(EnglishAuction _auction) public {
        auction = _auction;
    }

    //wrapped call
    function bid(uint bidValue) public returns (bool success){
      success = auction.call.value(bidValue).gas(200000)(bytes4 (keccak256("bid()")));
    }

    //can receive money
    function() public payable{}
}

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

