// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ChainCrush is ERC721, Ownable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    Counters.Counter private _tokenIdCounter;
    
    // NFT Traits
    enum Trait { Common, Epic, Rare, Legendary }
    
    // Constants
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MAX_SUPPLY = 10000; // Maximum supply of 10,000 NFTs
    uint256 public constant DAILY_MINT_LIMIT = 3; // Maximum 3 mints per day per user
    string private _baseTokenURI;
    address private _signerAddress;

    // Trait probabilities (in basis points - 10000 = 100%)
    uint16 public constant COMMON_PROBABILITY = 6000;    // 60%
    uint16 public constant EPIC_PROBABILITY = 2500;      // 25%
    uint16 public constant RARE_PROBABILITY = 1200;      // 12%
    uint16 public constant LEGENDARY_PROBABILITY = 300;  // 3%

    // Mapping to track token traits
    mapping(uint256 => Trait) public tokenTraits;
    
    // Mapping to track daily mints per user
    mapping(address => mapping(uint256 => uint256)) public dailyMints; // user => day => count

    // Events
    event BaseURIUpdated(string newBaseURI);
    event SignerAddressUpdated(address newSignerAddress);
    event NFTMinted(address indexed minter, uint256 tokenId, Trait trait, uint256 score);
    event NFTBurned(address indexed burner, uint256 tokenId, Trait trait);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address signerAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _signerAddress = signerAddress;
    }

    // Function to get current day (timestamp / 86400)
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 86400;
    }

    // Function to check if user can mint today
    function canMintToday(address user) public view returns (bool) {
        uint256 currentDay = getCurrentDay();
        return dailyMints[user][currentDay] < DAILY_MINT_LIMIT;
    }

    // Function to get remaining mints for user today
    function getRemainingMintsToday(address user) public view returns (uint256) {
        uint256 currentDay = getCurrentDay();
        uint256 usedMints = dailyMints[user][currentDay];
        return usedMints >= DAILY_MINT_LIMIT ? 0 : DAILY_MINT_LIMIT - usedMints;
    }

    // Function to verify the signature for game score
    function verifySignature(
        address user,
        uint256 score,
        uint256 timestamp,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(user, score, timestamp));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(signature) == _signerAddress;
    }

    // Mint NFT based on game score
    function mintNFT(
        uint256 score,
        uint256 timestamp,
        bytes memory signature
    ) external payable {
        require(msg.value == MINT_PRICE, "Incorrect payment amount");
        require(verifySignature(msg.sender, score, timestamp, signature), "Invalid signature");
        require(block.timestamp - timestamp <= 300, "Signature expired"); // 5 minutes
        
        // Check supply limit
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Maximum supply reached");
        
        // Check daily mint limit
        uint256 currentDay = getCurrentDay();
        require(dailyMints[msg.sender][currentDay] < DAILY_MINT_LIMIT, "Daily mint limit reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Update daily mint count
        dailyMints[msg.sender][currentDay]++;
        
        // Determine trait based on score and randomness
        Trait trait = determineTrait(score);
        tokenTraits[tokenId] = trait;
        
        _safeMint(msg.sender, tokenId);
        
        emit NFTMinted(msg.sender, tokenId, trait, score);
    }

    // Determine trait based on score and randomness
    function determineTrait(uint256 score) internal view returns (Trait) {
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            score
        ))) % 10000;
        
        // Higher scores increase chances of better traits
        uint256 scoreBonus = (score / 1000) * 100; // Bonus per 1000 points
        randomValue = randomValue > scoreBonus ? randomValue - scoreBonus : 0;
        
        if (randomValue < LEGENDARY_PROBABILITY) {
            return Trait.Legendary;
        } else if (randomValue < LEGENDARY_PROBABILITY + RARE_PROBABILITY) {
            return Trait.Rare;
        } else if (randomValue < LEGENDARY_PROBABILITY + RARE_PROBABILITY + EPIC_PROBABILITY) {
            return Trait.Epic;
        } else {
            return Trait.Common;
        }
    }

    // Burn NFT to get rewards (only Epic, Rare, Legendary)
    function burnNFT(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        Trait trait = tokenTraits[tokenId];
        require(trait != Trait.Common, "Cannot burn Common NFTs");
        
        emit NFTBurned(msg.sender, tokenId, trait);
        _burn(tokenId);
    }

    // Get trait of a token
    function getTokenTrait(uint256 tokenId) external view returns (Trait) {
        require(_exists(tokenId), "Token does not exist");
        return tokenTraits[tokenId];
    }

    // Get user's NFTs by trait
    function getUserNFTsByTrait(address user, Trait trait) external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](balanceOf(user));
        uint256 count = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == user && tokenTraits[i] == trait) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(_baseURI(), tokenId.toString()));
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setSignerAddress(address newSignerAddress) external onlyOwner {
        _signerAddress = newSignerAddress;
        emit SignerAddressUpdated(newSignerAddress);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter.current();
    }

    function getSignerAddress() external view returns (address) {
        return _signerAddress;
    }

    // Function to withdraw collected ether
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ether to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
} 