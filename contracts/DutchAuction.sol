// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract DutchAuction is Auction {

    uint public initialPrice;
    uint public biddingPeriod;
    uint public offerPriceDecrement;

    // TODO: Your code here

    // constructor
    constructor(address sellerAddress_,
                          uint initialPrice_,
                          uint biddingPeriod_,
                          uint offerPriceDecrement_)
             Auction (sellerAddress_) {

          // TODO: Your code here

    }


    function bid() public payable{

          // TODO: Your code here

    }

}
