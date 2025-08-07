// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ChainCrush.sol";

contract TokenReward is Ownable {
    using ECDSA for bytes32;

    // ChainCrush NFT contract
    ChainCrush public chainCrushNFT;
    
    // Mapping to track used signatures
    mapping(bytes => bool) public usedSignatures;
    
    // Server's public key for signature verification
    address public serverSigner;



    // Supported reward tokens
    mapping(address => bool) public supportedTokens;

    event TokenRewarded(address indexed user, address indexed token, uint256 amount, ChainCrush.Trait trait);
    event ServerSignerUpdated(address indexed newSigner);
    event SupportedTokenUpdated(address indexed token, bool supported);
    event NFTBurnedForReward(address indexed user, uint256 tokenId, ChainCrush.Trait trait, uint256 rewardAmount);

    constructor(address _serverSigner, address _chainCrushNFT) {
        serverSigner = _serverSigner;
        chainCrushNFT = ChainCrush(_chainCrushNFT);
    }

    function updateServerSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        serverSigner = _newSigner;
        emit ServerSignerUpdated(_newSigner);
    }

    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit SupportedTokenUpdated(token, supported);
    }

    function setChainCrushNFT(address _chainCrushNFT) external onlyOwner {
        chainCrushNFT = ChainCrush(_chainCrushNFT);
    }

    // Burn NFT and claim token reward
    function burnNFTForReward(
        uint256 tokenId,
        address rewardToken,
        uint256 rewardAmount,
        bytes memory signature
    ) external {
        require(!usedSignatures[signature], "Signature already used");
        require(supportedTokens[rewardToken], "Token not supported");
        require(verifyBurnSignature(msg.sender, tokenId, rewardToken, rewardAmount, signature), "Invalid signature");

        // Check if user owns the NFT
        require(chainCrushNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        // Get NFT trait
        ChainCrush.Trait trait = chainCrushNFT.getTokenTrait(tokenId);
        require(trait != ChainCrush.Trait.Common, "Cannot burn Common NFTs");

        // Mark signature as used
        usedSignatures[signature] = true;

        // Burn the NFT
        chainCrushNFT.burnNFT(tokenId);

        // Transfer reward tokens
        require(IERC20(rewardToken).transfer(msg.sender, rewardAmount), "Transfer failed");

        emit NFTBurnedForReward(msg.sender, tokenId, trait, rewardAmount);
        emit TokenRewarded(msg.sender, rewardToken, rewardAmount, trait);
    }



    // Verify signature for burning NFT
    function verifyBurnSignature(
        address user,
        uint256 tokenId,
        address rewardToken,
        uint256 rewardAmount,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                user,
                tokenId,
                rewardToken,
                rewardAmount
            )
        );

        bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = signedMessageHash.recover(signature);

        return recoveredSigner == serverSigner;
    }

    // Legacy function for direct token rewards (for backward compatibility)
    function claimTokenReward(
        address token,
        uint256 amount,
        bytes memory signature
    ) external {
        require(!usedSignatures[signature], "Signature already used");
        require(supportedTokens[token], "Token not supported");
        require(verifySignature(token, amount, signature), "Invalid signature");

        usedSignatures[signature] = true;
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");

        emit TokenRewarded(msg.sender, token, amount, ChainCrush.Trait.Common);
    }

    function verifySignature(
        address token,
        uint256 amount,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount
            )
        );

        bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = signedMessageHash.recover(signature);

        return recoveredSigner == serverSigner;
    }

    // Function to withdraw any stuck tokens
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }

    // Function to get user's burnable NFTs
    function getUserBurnableNFTs(address user) external view returns (uint256[] memory) {
        uint256[] memory epicNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Epic);
        uint256[] memory rareNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Rare);
        uint256[] memory legendaryNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Legendary);
        
        uint256 totalBurnable = epicNFTs.length + rareNFTs.length + legendaryNFTs.length;
        uint256[] memory result = new uint256[](totalBurnable);
        
        uint256 index = 0;
        
        // Add Epic NFTs
        for (uint256 i = 0; i < epicNFTs.length; i++) {
            result[index] = epicNFTs[i];
            index++;
        }
        
        // Add Rare NFTs
        for (uint256 i = 0; i < rareNFTs.length; i++) {
            result[index] = rareNFTs[i];
            index++;
        }
        
        // Add Legendary NFTs
        for (uint256 i = 0; i < legendaryNFTs.length; i++) {
            result[index] = legendaryNFTs[i];
            index++;
        }
        
        return result;
    }

    // Function to get all NFTs by address
    function getAllNFTsByAddress(address user) external view returns (uint256[] memory) {
        uint256[] memory commonNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Common);
        uint256[] memory epicNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Epic);
        uint256[] memory rareNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Rare);
        uint256[] memory legendaryNFTs = chainCrushNFT.getUserNFTsByTrait(user, ChainCrush.Trait.Legendary);
        
        uint256 totalNFTs = commonNFTs.length + epicNFTs.length + rareNFTs.length + legendaryNFTs.length;
        uint256[] memory result = new uint256[](totalNFTs);
        
        uint256 index = 0;
        
        // Add Common NFTs
        for (uint256 i = 0; i < commonNFTs.length; i++) {
            result[index] = commonNFTs[i];
            index++;
        }
        
        // Add Epic NFTs
        for (uint256 i = 0; i < epicNFTs.length; i++) {
            result[index] = epicNFTs[i];
            index++;
        }
        
        // Add Rare NFTs
        for (uint256 i = 0; i < rareNFTs.length; i++) {
            result[index] = rareNFTs[i];
            index++;
        }
        
        // Add Legendary NFTs
        for (uint256 i = 0; i < legendaryNFTs.length; i++) {
            result[index] = legendaryNFTs[i];
            index++;
        }
        
        return result;
    }
} 