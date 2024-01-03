// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";

contract Account is IAccount {
    address public owner;
    uint256 public count;

    constructor(address _owner) {
        owner = _owner;
    }

    function validateUserOp(UserOperation calldata, bytes32, uint256) external pure returns (uint256 validationData) {
        // typically here we'd check this signature
        return 0;
    }

    function execute() external {
        count++;
    }
}

contract AccountFactory {
    event AccountCreated(address indexed accountAddress, address indexed owner);

    function createAccount(address _owner) public returns (address) {
        Account newAccount = new Account(_owner);
        emit AccountCreated(address(newAccount), _owner);
        return address(newAccount);
    }
}
