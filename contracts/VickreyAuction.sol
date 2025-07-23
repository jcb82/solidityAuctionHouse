// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

contract VickreyAuction is Auction {

    uint public minimumPrice;
    uint public biddingDeadline;
    uint public revealDeadline;
    uint public bidDepositAmount;

    mapping(address => bytes32) internal bids;
    uint internal highestBidValue;
    uint internal secondHighestBidValue;
    address internal highestBidder;

    // constructor
    constructor(address _sellerAddress,
                            address _judgeAddress,
                            uint _minimumPrice,
                            uint _biddingPeriod,
                            uint _revealPeriod,
                            uint _bidDepositAmount)
             Auction (_sellerAddress, _judgeAddress, address(0), 0) {

        minimumPrice = _minimumPrice;
        bidDepositAmount = _bidDepositAmount;
        biddingDeadline = time() + _biddingPeriod;
        revealDeadline = time() + _biddingPeriod + _revealPeriod;

        highestBidValue = minimumPrice;
        secondHighestBidValue = minimumPrice;
    }

    // Record the player's bid commitment
    // Make sure exactly bidDepositAmount is provided (for new bids)
    // Bidders can update their previous bid for free if desired.
    // Only allow commitments before biddingDeadline
    function commitBid(bytes32 bidCommitment) public payable {

        // reject invalid bids
        require(time() < biddingDeadline, "Bid too late");
        if (bids[msg.sender] == 0)
            require(msg.value == bidDepositAmount, "Must provide required deposit");
        else if (bids[msg.sender] != 0)
            require(msg.value == 0, "No deposit for updated bid");

        bids[msg.sender] = bidCommitment;
    }

    // Check that the bid (msg.value) matches the commitment.
    // If the bid is correctly opened, the bidder can withdraw their deposit.
    function revealBid(uint nonce) public payable{

        // bidding time period
        require(time() >= biddingDeadline, "Reveal too early");
        require(time() < revealDeadline, "Reveal too late");

        // correct commitment opening
        require(keccak256(abi.encodePacked(msg.value, nonce)) == bids[msg.sender], "Incorrect bid opening");

        // refund bid deposit
        bids[msg.sender] = bytes32(0);

        if((msg.value > highestBidValue || (msg.value == highestBidValue && highestBidder == address(0)))) {
            if (highestBidder != address(0))
                balances[highestBidder] += highestBidValue;
            secondHighestBidValue = highestBidValue;
            highestBidder = msg.sender;
            highestBidValue = msg.value;
            balances[msg.sender] += bidDepositAmount;
        }
        else {
            balances[msg.sender] += bidDepositAmount + msg.value;
            if (msg.value > secondHighestBidValue) {
                secondHighestBidValue = msg.value;
            }
        }
    }

    // Need to override the default implementation
    function getWinner() public override view returns (address winner){
        if (time() < revealDeadline)
          return address(0);
        return highestBidder;
    }

    // finalize() must be extended here to provide a refund to the winner
    // based on the final sale price (the second highest bid, or reserve price).
    function finalize() public override {

        if (highestBidder != address(0))
            winnerAddress = highestBidder;
        if (highestBidValue > secondHighestBidValue)
            balances[highestBidder] += (highestBidValue - secondHighestBidValue);

        // call the general finalize() logic
        super.finalize();
    }
}
