// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";

contract Paymaster is IPaymaster {
    function validatePaymasterUserOp(UserOperation calldata, bytes32, uint256)
        external
        pure
        override
        returns (bytes memory context, uint256 validationData)
    {
        context = new bytes(0);

        bytes20 sigAuthorizer = bytes20(address(0)); // Indicating valid signature
        bytes6 validUntil = bytes6(0); // Indicating "indefinite"
        bytes6 validAfter = bytes6(0); // Indicating valid from any time

        validationData = uint256(bytes32(abi.encodePacked(sigAuthorizer, validUntil, validAfter)));

        return (context, validationData);
    }

    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external override {}
}
