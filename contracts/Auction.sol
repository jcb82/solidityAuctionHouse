// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";

contract Auction is IERC721Receiver{

    event NFTReceived(address operator, address from, uint256 tokenId, bytes data);

    address internal _sellerAddress;
    address internal _winnerAddress;
    uint internal _winningPrice;

    // TODO: Your code here

    // constructor
    constructor(address sellerAddress_) payable {
        _sellerAddress = sellerAddress_;
        if (_sellerAddress == address(0))
          _sellerAddress = msg.sender;
          
          // TODO: Your code here
    }

    // Designate a judge for the auction. This should only be callable
    // by the seller and only callable once. Once the judge is set,
    // nobody can change or revoke the judge.
    function setJudge(address judgeAddress_) public{

          // TODO: Your code here
          
    }
    
    // Designate an NFT marketplace used bye the auction. This should only 
    // be callable by the seller and only callable once. Once set,
    // nobody can change or marketplace.
    function setNFTContract(ERC721 nftContract_) public{
    
          // TODO: Your code here
          
    }

    // This is used in testing.
    // You should use this instead of block.number directly.
    // You should not modify this function.
    function time() public view returns (uint) {
        return block.number;
    }

    function getJudge() public view virtual returns (address winner) {
    
          // TODO: Your code here
          
    }

    function getWinner() public view virtual returns (address winner) {
        return _winnerAddress;
    }

    function getWinningPrice() public view returns (uint price) {
        return _winningPrice;
    }

    // If no judge is specified, anybody can call this.
    // If a judge is specified, then only the judge or winning bidder may call.
    function finalize() public virtual {

          // TODO: Your code here

    }

    // This can ONLY be called by seller or the judge (if a judge exists).
    // Money should only be refunded to the winner.
    function refund() public {

          // TODO: Your code here

    }

    // Withdraw funds from the contract.
    // If called, all funds available to the caller should be refunded.
    // This should be the *only* place the contract ever transfers funds out.
    // Ensure that your withdrawal functionality is not vulnerable to
    // re-entrancy or unchecked-error vulnerabilities.
    function withdraw() public {

          // TODO: Your code here

    }


    // This function is called whenever an NFT is transferred to this contract via safeTransferFrom
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenID,
        bytes calldata data
    ) external override returns (bytes4) {
    
        // Emit an event confirming receipt
        emit NFTReceived(operator, from, tokenID, data);

        // TODO: Your code here

        // Must return this selector to confirm receipt
        return IERC721Receiver.onERC721Received.selector;
    }

}
