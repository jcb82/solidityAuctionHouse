// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

// A very simple auction for testing.
// You shouldn't need to modify this code.
contract DummyAuction is Auction {

    // constructor
    constructor(address sellerAddress_)
                Auction (sellerAddress_) payable {
    }
    
    // Dummy function to declare a winner. Obviously insecure,
    // anybody can call it.
    function declareWinner(address winnerAddress_,
                            uint winningPrice_) payable public {
        _winnerAddress = winnerAddress_;
        _winningPrice = winningPrice_;                 
    }

}
