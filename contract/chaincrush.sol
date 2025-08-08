// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ChainCrush is ERC721, Ownable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    Counters.Counter private _tokenIdCounter;

    enum Trait { Common, Epic, Rare, Legendary }

    uint256 public constant MINT_PRICE = 0 ether;
    uint256 public maxSupply = 10000;
    uint256 public constant DAILY_MINT_LIMIT = 5; // Maximum 3 
    string private _baseTokenURI;
    address private _signerAddress;

    uint16 public constant COMMON_PROBABILITY = 6000;
    uint16 public constant EPIC_PROBABILITY = 2500;
    uint16 public constant RARE_PROBABILITY = 1200;
    uint16 public constant LEGENDARY_PROBABILITY = 300;

    mapping(uint256 => Trait) public tokenTraits;

       mapping(address => mapping(uint256 => uint256)) public dailyMints; // user => day => count


    event BaseURIUpdated(string newBaseURI);
    event SignerAddressUpdated(address newSignerAddress);
    event NFTMinted(address indexed minter, uint256 tokenId, Trait trait, uint256 score);
    event NFTBurned(address indexed burner, uint256 tokenId, Trait trait);
    event MaxSupplyIncreased(uint256 previousMaxSupply, uint256 newMaxSupply);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address signerAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _signerAddress = signerAddress;
    }

function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 86400;
    }

     function canMintToday(address user) public view returns (bool) {
        uint256 currentDay = getCurrentDay();
        return dailyMints[user][currentDay] < DAILY_MINT_LIMIT;
    }

     function getRemainingMintsToday(address user) public view returns (uint256) {
        uint256 currentDay = getCurrentDay();
        uint256 usedMints = dailyMints[user][currentDay];
        return usedMints >= DAILY_MINT_LIMIT ? 0 : DAILY_MINT_LIMIT - usedMints;
    }
    
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

    function mintNFT(
        uint256 score,
        uint256 timestamp,
        bytes memory signature
    ) external payable {
        require(msg.value == MINT_PRICE, "Incorrect payment");
        require(verifySignature(msg.sender, score, timestamp, signature), "Invalid signature");
        require(block.timestamp - timestamp <= 300, "Signature expired");
        require(_tokenIdCounter.current() < maxSupply, "Maximum supply reached");
 uint256 currentDay = getCurrentDay();
        require(dailyMints[msg.sender][currentDay] < DAILY_MINT_LIMIT, "Daily mint limit reached");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        dailyMints[msg.sender][currentDay]++;

        Trait trait = determineTrait(score);
        tokenTraits[tokenId] = trait;

        _safeMint(msg.sender, tokenId);
        emit NFTMinted(msg.sender, tokenId, trait, score);
    }

    function determineTrait(uint256 score) internal view returns (Trait) {
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            score
        ))) % 10000;

        uint256 scoreBonus = (score / 1000) * 100;
        randomValue = randomValue > scoreBonus ? randomValue - scoreBonus : 0;

        if (randomValue < LEGENDARY_PROBABILITY) return Trait.Legendary;
        if (randomValue < LEGENDARY_PROBABILITY + RARE_PROBABILITY) return Trait.Rare;
        if (randomValue < LEGENDARY_PROBABILITY + RARE_PROBABILITY + EPIC_PROBABILITY) return Trait.Epic;
        return Trait.Common;
    }

    function burnNFT(uint256 tokenId) external {
        require(_ownerExists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        Trait trait = tokenTraits[tokenId];
        require(trait != Trait.Common, "Cannot burn Common NFT");

        emit NFTBurned(msg.sender, tokenId, trait);
        _burn(tokenId);
    }

    function getTokenTrait(uint256 tokenId) external view returns (Trait) {
        require(_ownerExists(tokenId), "Token does not exist");
        return tokenTraits[tokenId];
    }

    function getUserNFTsByTrait(address user, Trait trait) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory temp = new uint256[](balance);
        uint256 count = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_ownerExists(i) && ownerOf(i) == user && tokenTraits[i] == trait) {
                temp[count++] = i;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) result[j] = temp[j];
        return result;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerExists(tokenId), "Token does not exist");
        return string(abi.encodePacked(_baseTokenURI));
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setSignerAddress(address newSignerAddress) external onlyOwner {
        _signerAddress = newSignerAddress;
        emit SignerAddressUpdated(newSignerAddress);
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function getSignerAddress() external view returns (address) {
        return _signerAddress;
    }
    function getRemainingSupply() external view returns (uint256) {
        return maxSupply - _tokenIdCounter.current();
    }

     function MAX_SUPPLY() external view returns (uint256) {
        return maxSupply;
    }

    function increaseMaxSupply(uint256 newMaxSupply) external onlyOwner {
        uint256 previous = maxSupply;
        require(newMaxSupply > previous, "New max must be greater");
        maxSupply = newMaxSupply;
        emit MaxSupplyIncreased(previous, newMaxSupply);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /// Helper function since _exists is now internal in OZ 5.x
    function _ownerExists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}
