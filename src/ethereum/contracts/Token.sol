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

  // Internal transfer function
  function _transfer(address _from, address _to, uint256 _value) internal returns (bool success) {
    require(_value <= balanceOf[_from]);
    require(_to != address(0));

    balanceOf[_from] = balanceOf[_from].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(_from, _to, _value);

    return true;
  }

  // Transfer Tokens 
  function transfer(address _to, uint256 _value) public returns (bool success) {
    _transfer(msg.sender, _to, _value);
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

  // Transfer From Tokens
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    require(_value <= allowance[_from][msg.sender]);

    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    _transfer(_from, _to, _value);
    
    return true;
  }
}