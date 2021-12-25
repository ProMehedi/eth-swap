// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Token {
  using SafeMath for uint;

  // Variables
  string public name = "My Token";
  string public symbol = "MTK";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  // Events
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  // Constructor
  constructor() {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  // Transfer Tokens 
  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(_value <= balanceOf[msg.sender]);
    require(_to != address(0));

    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);

    return true;
  }

  // Approve Tokens for Spender
  function approve(address _spender, uint256 _value) public returns (bool success) {
    require(_value <= balanceOf[msg.sender]);
    require(_spender != address(0));

    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);

    return true;
  }
}