// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Token.sol";

contract Exchange {    
  // Variables
  address public feeAccount;
  uint256 public feeRate;

  // Constructor
  constructor(address _feeAccount, uint256 _feeRate) {
    feeAccount = _feeAccount;
    feeRate = _feeRate;
  }

  // Deposit Token
  function depositToken(address _token, uint256 _amount) public payable {
    Token(_token).transferFrom(msg.sender, address(this), _amount);
  }
}