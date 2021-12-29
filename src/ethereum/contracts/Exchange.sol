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
  mapping (uint256 => _Order) public orders;
  uint256 public orderCount;

  // Orders are stored in a tree-like structure
  struct _Order {
    uint id;
    address user;
    address tokenGet;
    uint amountGet;
    address tokenGive;
    uint amountGive;
    uint timestamp;
  }

  // Events
  event Deposit(address indexed token, address indexed user, uint256 amount, uint256 balance);
  event Withdraw(address indexed token, address indexed user, uint256 amount, uint256 balance);
  event Order(uint indexed id, address indexed user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint timestamp);

  // Constructor
  constructor(address _feeAccount, uint256 _feeRate) {
    feeAccount = _feeAccount;
    feeRate = _feeRate;
  }

  // Fallback: if Ether is sent to the contract by mistake
  fallback() external {
    revert();
  }

  // Deposit Ether
  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  // Withdraw Ether
  function withdrawEther(uint256 _amount) public {
    require(_amount <= tokens[ETHER][msg.sender]);
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    payable(msg.sender).transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  // Deposit Token
  function depositToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));

    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  // Withdraw Token
  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(tokens[_token][msg.sender] >= _amount);
    require(Token(_token).transfer(msg.sender, _amount));

    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  // Get balance
  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  // Make an order
  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount.add(1);
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
  }
}