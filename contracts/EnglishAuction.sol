// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Auction.sol";

contract EnglishAuction is Auction {

    uint public initialPrice;
    uint public biddingPeriod;
    uint public minimumPriceIncrement;

   agent Bidder {
	val random = new Random
	var maxPrice : float
	var myLastBid : float
	
	on Initialize {
		maxPrice = random.nextFloat() * 900f + 100f
	}
	
	uses DefaultContextInteractions, Logging

	on Price {
		if(occurrence.price == myLastBid) {
			println("I do not bet, I am the winner with :" + myLastBid)
		} else {
			if(occurrence.price < maxPrice) {
				var priceIncrease = random.nextFloat() * 50f
				if (priceIncrease > 0) {
					var newPrice = occurrence.price + priceIncrease
					if (newPrice <= maxPrice) {
						emit(new Bid(newPrice))
						myLastBid = newPrice
					} else {
						println(" I give up, this is beyond my resources : " + myLastBid)
					}
				}
			} else {
				println("I dropped to " + myLastBid)
			}
		}
	}
}

    // constructor
    constructor(address _sellerAddress,
                          address _judgeAddress,
                          address _timerAddress,
                          uint _initialPrice,
                          uint _biddingPeriod,
                          uint _minimumPriceIncrement)
             Auction (_sellerAddress, _judgeAddress, _timerAddress) {

        initialPrice = _initialPrice;
        biddingPeriod = _biddingPeriod;
        minimumPriceIncrement = _minimumPriceIncrement;

        event Bid {
	val value : float
	new(value : float) {
		this.value = value
	}
}
agent Bidder {
	val random = new Random
	var maxPrice : float
	
	on Initialize {
		maxPrice = random.nextFloat() * 900f + 100f
	}
}
contract ERC721 is Context, ERC165, IERC721, IERC721Metadata {
    using Address for address;
    using Strings for uint256;

   
    string private _name;

   
    string private _symbol;

    
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

   
    mapping(uint256 => address) private _tokenApprovals;

   
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    }

    function bid() public payable{
        agent Bidder {
	val random = new Random
	var maxPrice : float
	var myLastBid : float
	
	on Initialize {
		maxPrice = random.nextFloat() * 900f + 100f
	}

	uses DefaultContextInteractions, Logging

	on Price {
		if(occurrence.price == myLastBid) {
			println("I do not bet, I am the winner with :" + myLastBid)
		} else {
			if(occurrence.price < maxPrice) {
				var priceIncrease = random.nextFloat() * 50f
				if (priceIncrease > 0) {
					var newPrice = occurrence.price + priceIncrease
					if (newPrice <= maxPrice) {
						emit(new Bid(newPrice)) [ it.ID == defaultContext.ID]
						myLastBid = newPrice
					} else {
						println(" I give up, this is beyond my resources : " + myLastBid)
					}
				}
			} else {
				println("I dropped to " + myLastBid)
			}
		}
	}
}
    }

    // Need to override the default implementation
    function getWinner() public override view returns (address winner){
        return winnerAddress;
        agent Auctioneer {
					
	uses Behaviors, Lifecycle, InnerContextAccess, Schedules, Logging
	
	var maxBid = 0f
	var winner : Address
	var hasBid = false 
	var isAuctionOpened = true
	
	on Initialize {
		for(i : 1..3) {
			spawnInContext(Bidder, innerContext)
		}
		
		wake(new Price(50))
		in(10000) [
			val waitTask = task("wait-task")
			waitTask.every(10000) [
				synchronized(this) {
					if (!isAuctionOpened) {
						if (!hasMemberAgent) {
							waitTask.cancel
							killMe
						}
					} else {
						if (!hasBid) {
							isAuctionOpened = false
							if (winner === null) {
								println("No winner")
							} else {
								println("The winner is " + winner
									+ " with the bid of " + maxBid)
							}
							wake(new StopAuction)
						}
						hasBid = false
					}
				}
			]
		]
	}
	
	on Bid [ isAuctionOpened ] {
		synchronized(this) {
			hasBid = true
			if (occurrence.value > maxBid) {
				maxBid = occurrence.value
				winner = occurrence.source
			}
		}
	}
}
    }
}
