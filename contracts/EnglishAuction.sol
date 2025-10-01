// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract EnglishAuction is Auction {

    uint public initialPrice;
    uint public biddingPeriod;
    uint public minimumPriceIncrement;

    // TODO: Your code here
    
    // constructor
    constructor(address sellerAddress_,
                          uint initialPrice_,
                          uint biddingPeriod_,
                          uint minimumPriceIncrement_)
             Auction (sellerAddress_) {

        // TODO: Your code here
    }

    function bid() public payable{
    
          // TODO: Your code here
          
    }

    // Need to override the default implementation
    function getWinner() public override view returns (address winner){
    
          // TODO: Your code here
          
    }
}
