// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Exchange {    
  // Variables
  address public feeAccount;
  uint256 public feeRate;

  // Constructor
  constructor(address _feeAccount, uint256 _feeRate) {
    feeAccount = _feeAccount;
    feeRate = _feeRate;
  }

  // Set the fee account
}