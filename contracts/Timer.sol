pragma solidity ^0.4.18;

// Simple contract to store time. You should not need to be modify this contract.
contract Timer {

    uint time;
    uint startTime;
    address owner;

    // constructor
    constructor(uint _startTime) public {
        owner = msg.sender;
        time = _startTime;
        startTime = _startTime;
    }

    function getTime() public view returns (uint) {
        return time;
    }

    function resetTime() public ownerOnly {
        time = startTime;
    }

    function setTime(uint _newTime) public ownerOnly {
        time = _newTime;
    }

    function offsetTime(uint _offset) public ownerOnly {
        time += _offset;
    }
    
    modifier ownerOnly {
        if (msg.sender != owner)
            revert();
        _;
    }
}
