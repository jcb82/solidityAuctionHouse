// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auction {

    address internal judgeAddress;
    address internal timerAddress;
    address internal sellerAddress;
    address internal winnerAddress;
    uint winningPrice;

    mapping(address => uint) balances;

    // constructor
    constructor(address _sellerAddress,
                address _judgeAddress,
                address _winnerAddress,
                uint _winningPrice) payable {

        judgeAddress = _judgeAddress;
        sellerAddress = _sellerAddress;
        if (sellerAddress == address(0))
          sellerAddress = msg.sender;
        winnerAddress = _winnerAddress;
        winningPrice = _winningPrice;
    }

    // This is used in testing.
    // You should use this instead of block.number directly.
    // You should not modify this function.
    function time() public view returns (uint) {
        return block.number;
    }

    function getWinner() public view virtual returns (address winner) {
        return winnerAddress;
    }

    function getWinningPrice() public view returns (uint price) {
        return winningPrice;
    }

    // If no judge is specified, anybody can call this.
    // If a judge is specified, then only the judge or winning bidder may call.
    function finalize() public virtual {
        require(getWinner() != address(0), "Must specify winner address");
        require(judgeAddress == address(0) || msg.sender == getWinner() || msg.sender == judgeAddress, "Only judge or winner can finalize.");
        balances[sellerAddress] += winningPrice;
    }

    // This can ONLY be called by seller or the judge (if a judge exists).
    // Money should only be refunded to the winner.
    function refund() public {
        require(getWinner() != address(0), "Can't issue refund with no winner");
        require (msg.sender == sellerAddress || msg.sender == judgeAddress, "Only seller or judge can issue refund");
        balances[winnerAddress] += winningPrice;
    }

    // Withdraw funds from the contract.
    // If called, all funds available to the caller should be refunded.
    // This should be the *only* place the contract ever transfers funds out.
    // Ensure that your withdrawal functionality is not vulnerable to
    // re-entrancy or unchecked-spend vulnerabilities.
    function withdraw() public {
        if (balances[msg.sender] > 0) {
            payable(msg.sender).transfer(balances[msg.sender]);
        }
        balances[msg.sender] = 0;
    }

}
