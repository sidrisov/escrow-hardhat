// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
    address public arbiter;
    address public beneficiary;
    address public depositor;
    uint public expiry;

    bool public isApproved;
    bool public isExpired;

    constructor(address _arbiter, address _beneficiary, uint _expiry) payable {
        arbiter = _arbiter;
        beneficiary = _beneficiary;
        depositor = msg.sender;
        if (_expiry == 0) {
            expiry = 0;
        } else {
            expiry = 1000 * block.timestamp + _expiry;
        }
    }

    event Approved(uint);
    event Expired(address);

    function approve() external {
        require(msg.sender == arbiter);
        require(!isExpired);

        uint balance = address(this).balance;
        (bool sent, ) = payable(beneficiary).call{value: balance}("");
        require(sent, "Failed to send Ether");
        emit Approved(balance);
        isApproved = true;
    }

    function validate() external {
        require(!isApproved);
        require(!isExpired);

        if (expiry != 0 && expiry <= 1000 * block.timestamp) {
            uint balance = address(this).balance;
            (bool sent, ) = payable(depositor).call{value: balance}("");
            require(sent, "Failed to send Ether");

            emit Expired(address(this));
            isExpired = true;
        }
    }
}
