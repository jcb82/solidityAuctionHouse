pragma solidity ^0.4.18;
import "./Timer.sol";

contract Auction {

    address internal judgeAddress;
    address internal timerAddress;
    address internal sellerAddress;
    address internal winnerAddress;

    // constructor
    function Auction(address _sellerAddress,
                     address _judgeAddress,
                     address _timerAddress) public {

        judgeAddress = _judgeAddress;
        timerAddress = _timerAddress;
        sellerAddress = _sellerAddress;
        if (sellerAddress == 0)
          sellerAddress = msg.sender;
    }

    // This is provided for testing
    // You should use this instead of block.number directly
    // You should not modify this function.
    function time() public view returns (uint) {
        if (timerAddress != 0)
          return Timer(timerAddress).getTime();
        
        return block.number;
    }

    // If no judge is specified, anybody can call this.
    // If a judge is specified, then only the judge or winning bidder may call.
    function finalize() public {
        //TODO: place your code here
    }

    // This can ONLY be called by seller or the judge (if a judge exists).
    // Money should only be refunded to the winner.
    function refund() public {
        //TODO: place your code here
    } 

    function getWinner() public returns (address winner){
        return winnerAddress;
    }

}
