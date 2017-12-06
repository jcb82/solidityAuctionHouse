pragma solidity ^0.4.18;

// Simple contract to store time. You should not need to be modify this contract.
contract Timer {

    uint time;
    uint startTime;
    address owner;

    // constructor
    function Timer(uint _startTime) public {
        owner = msg.sender;
        time = _startTime;
        startTime = _startTime;
    }

    function getTime() public returns (uint) {
        return time;
    }

    function resetTime() ownerOnly {
        time = startTime;
    }

    function setTime(uint _newTime) ownerOnly {
        time = _newTime;
    }

    function offsetTime(uint _offset) ownerOnly {
        time += _offset;
    }
    
    modifier ownerOnly {
        if (msg.sender != owner)
            revert();
        _;
    }
}
