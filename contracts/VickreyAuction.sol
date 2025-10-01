// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract VickreyAuction is Auction {

    uint public minimumPrice;
    uint public biddingDeadline;
    uint public revealDeadline;
    uint public bidDepositAmount;

    // TODO: Your code here

    // constructor
    constructor(address sellerAddress_,
                            uint minimumPrice_,
                            uint biddingPeriod_,
                            uint revealPeriod_,
                            uint bidDepositAmount_)
             Auction (sellerAddress_) {

          // TODO: Your code here
          
    }

    // Record the player's bid commitment
    // Make sure exactly bidDepositAmount is provided (for new bids)
    // Bidders can update their previous bid for free if desired.
    // Only allow commitments before biddingDeadline
    function commitBid(bytes32 bidCommitment) public payable {

        // TODO: Your code here
          
    }

    // Check that the bid (msg.value) matches the commitment.
    // If the bid is correctly opened, the bidder can withdraw their deposit.
    function revealBid(uint nonce) public payable{

        // TODO: Your code here
           
    }

    // Need to override the default implementation
    function getWinner() public override view returns (address winner){
    
        // TODO: Your code here
             
    }

    // finalize() must be extended here to provide a refund to the winner
    // based on the final sale price (the second highest bid, or reserve price).
    function finalize() public override {

          // TODO: Your code here
          
    }
}
