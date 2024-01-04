// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Account is IAccount {
    address public owner;
    uint256 public count;

    constructor(address _owner) {
        owner = _owner;
    }

    function validateUserOp(UserOperation calldata op, bytes32 userOpHash, uint256)
        external
        view
        returns (uint256 validationData)
    {
        address recovered = ECDSA.recover(ECDSA.toEthSignedMessageHash(userOpHash), op.signature);
        return recovered == owner ? 0 : 1;
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
