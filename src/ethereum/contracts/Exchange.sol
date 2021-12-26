// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Token.sol";

contract Exchange {    
  using SafeMath for uint;

  // Variables
  address public feeAccount;
  uint256 public feeRate;
  address constant ETHER = address(0);
  mapping (address => mapping (address => uint256)) public tokens;

  // Events
  event Deposit(address indexed token, address indexed user, uint256 amount, uint256 balance);

  // Constructor
  constructor(address _feeAccount, uint256 _feeRate) {
    feeAccount = _feeAccount;
    feeRate = _feeRate;
  }

  // Deposit Ether
  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  // Deposit Token
  function depositToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  
}