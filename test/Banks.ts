// License-Identifier: MIT
// Written by Rohin Knight
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("Banks", function () {
  const ONE_ETH = ethers.utils.parseEther("1");

  async function setupBank(bankName: string): Promise<Contract> {
    const Bank = await ethers.getContractFactory(bankName);
    const bank = await Bank.deploy();
    await bank.deployed();
    
    // Deposit 1 ETH and confirm
    bank.deposit({value: ONE_ETH});
    return bank;
  }

  async function setupAttack(bank: Contract): Promise<Contract> {
    const [_, otherAccount] = await ethers.getSigners();
    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.connect(otherAccount).deploy(bank.address);

    await attack.deployed();
    return attack;
  }

  it("Attack Bank 1", async function () {
    const bank = await setupBank("Bank1");
    const attack = await setupAttack(bank);

    await attack.attack({ 
      value: ethers.utils.parseEther("0.01")
    });

    // Confirm attack was successful
    expect(await bank.provider.getBalance(bank.address)).to.equal(0);
  });

  // Bank 2 uses reentrancy guard
  it("Attack Bank 2", async function () {
    const bank = await setupBank("Bank2");
    const attack = await setupAttack(bank);

    await expect(attack.attack({ 
      value: ethers.utils.parseEther("0.01")
    })).to.be.revertedWith("withdraw failed");

    // Confirm attack failed
    expect(await bank.provider.getBalance(bank.address)).to.equal(ONE_ETH);
  });

  // Bank 3 uses CEI (Checks, Effects, Interactions) pattern
  it("Attack Bank 3", async function () {
    const bank = await setupBank("Bank3");
    const attack = await setupAttack(bank);

    await expect(attack.attack({ 
      value: ethers.utils.parseEther("0.01")
    })).to.be.revertedWith("withdraw failed");

    // Confirm attack failed
    expect(await bank.provider.getBalance(bank.address)).to.equal(ONE_ETH);
  });
});
