// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

//import "hardhat/console.sol";
import "./Escrow.sol";

contract EscrowFactory {
    mapping(address => Escrow) contracts;
    address[] toBeValidated;
    address[] addresses;

    event Created(address);

    function create(
        address _arbiter,
        address _beneficiary,
        uint _expiry
    ) external payable {
        Escrow escrow = new Escrow{value: msg.value}(
            _arbiter,
            _beneficiary,
            _expiry
        );

        address escrowAddress = address(escrow);

        contracts[escrowAddress] = escrow;
        toBeValidated.push(escrowAddress);
        addresses.push(escrowAddress);

        emit Created(escrowAddress);
    }

    function validate() external {
        for (uint i = 0; i < toBeValidated.length; i++) {
            if (toBeValidated[i] == address(0)) {
                continue;
            }

            Escrow escrow = contracts[toBeValidated[i]];
            if (escrow.isApproved() || escrow.isExpired()) {
                delete toBeValidated[i];
            } else {
                escrow.validate();
            }
        }
    }

    function getAddresses() external view returns (address[] memory) {
        return addresses;
    }
}
