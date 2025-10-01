// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A very simple NFT contract for testing.
// You shouldn't need to modify this code.
contract CatToken is ERC721, Ownable {
    uint256 private _nextTokenID;

    struct Attributes {
        string name;
        string color;
    }

    mapping(uint256 => Attributes) public catAttributes;

    constructor(address owner) ERC721("CatToken", "CAT") Ownable(owner) {}

    function mint(address owner, string memory name, string memory color) public onlyOwner returns (uint256 tokenID)   
    {
        tokenID = _nextTokenID++;
        _safeMint(owner, tokenID);
        catAttributes[tokenID] = Attributes(name, color);
    }
}
