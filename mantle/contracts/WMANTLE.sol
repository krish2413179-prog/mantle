// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WMANTLE - Wrapped Mantle
 * @dev Wrap native MNT into ERC-20 token
 * This allows ERC-20 approval pattern for spending permissions
 */
contract WMANTLE is ERC20 {
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    
    constructor() ERC20("Wrapped Mantle", "WMANTLE") {}
    
    /**
     * @dev Wrap MNT to WMANTLE
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send MNT");
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Unwrap WMANTLE to MNT
     */
    function withdraw(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @dev Allow depositing via receive
     */
    receive() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
}
