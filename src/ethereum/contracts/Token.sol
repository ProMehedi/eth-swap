// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
  string public name;
  string public symbol;
  uint public decimals;
  uint public totalSupply;

  constructor() {
    name = "My Token";
    symbol = "MTK";
    decimals = 18;
    totalSupply = 1000000 * (10 ** decimals);
  }
}