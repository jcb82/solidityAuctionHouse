// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract EnglishAuction is Auction {

    uint public initialPrice;
    uint public biddingPeriod;
    uint public minimumPriceIncrement;

    uint currentPrice;
    address currentWinner;
    uint bidDeadline;

    // constructor
    constructor(address _sellerAddress,
                          address _judgeAddress,
                          uint _initialPrice,
                          uint _biddingPeriod,
                          uint _minimumPriceIncrement)
             Auction (_sellerAddress, _judgeAddress, address(0), 0) {

        initialPrice = _initialPrice;
        biddingPeriod = _biddingPeriod;
        minimumPriceIncrement = _minimumPriceIncrement;

        currentPrice = initialPrice - minimumPriceIncrement;
        currentWinner = address(0);
        bidDeadline = time() + biddingPeriod;
    }

    function bid() public payable{
        require(time() < bidDeadline, "Bid too late");
        require(msg.value >= currentPrice + minimumPriceIncrement, "Bid too low");

        if (currentWinner != address(0))
            balances[currentWinner] += currentPrice;

        currentWinner = msg.sender;
        currentPrice = msg.value;
        bidDeadline = time() + biddingPeriod;
    }

    // Need to override the default implementation
    function getWinner() public override view returns (address winner){
        if (time() < bidDeadline)
          return address(0);
        return currentWinner;
    }
}
