pragma solidity ^0.4.18;

import "../contracts/Auction.sol";
import "../contracts/DutchAuction.sol";
import "../contracts/EnglishAuction.sol";
import "../contracts/VickreyAuction.sol";
import "../contracts/Timer.sol";
import "truffle/Assert.sol";


// Needs to be defined or else to be here or else Truffle complains
contract TestFramework{
    //can receive money
    function() public payable {}

}
