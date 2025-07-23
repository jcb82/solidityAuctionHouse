// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract DutchAuction is Auction {

    uint public initialPrice;
    uint public biddingPeriod;
    uint public offerPriceDecrement;

    uint startTime;

    // constructor
    constructor(address _sellerAddress,
                          address _judgeAddress,
                          uint _initialPrice,
                          uint _biddingPeriod,
                          uint _offerPriceDecrement)
             Auction (_sellerAddress, _judgeAddress, address(0), 0) {

        initialPrice = _initialPrice;
        biddingPeriod = _biddingPeriod;
        offerPriceDecrement = _offerPriceDecrement;

        startTime = time();
    }


    function bid() public payable{
        uint blocksElapsed = time() - startTime;
        require(blocksElapsed < biddingPeriod, "Bid too late");
        require(winnerAddress == address(0), "Bid after Dutch auction finished");

        uint currentPrice = initialPrice - offerPriceDecrement * blocksElapsed;
        require(msg.value >= currentPrice, "Bid must meet minimum value");
        winnerAddress = msg.sender;
        if (msg.value > currentPrice) {
            balances[winnerAddress] += (msg.value - currentPrice);
        }
    }

}
