'use client'

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Phaser from 'phaser';
import { APP_URL } from '@/lib/constants';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getPlayerData } from '@/lib/leaderboard';
import { useContractWrite, useContractRead, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI } from '@/lib/contracts';
import ConfirmEndGameModal from '../ConfirmEndGameModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCoins, 
  faCheckCircle, 
  faExclamationTriangle, 
  faSpinner,
  faTimes,
  faGift
} from '@fortawesome/free-solid-svg-icons';

interface CandyCrushGameProps {
  onBack?: () => void;
}

export default function CandyCrushGame({ onBack }: CandyCrushGameProps) {
  const { context, actions } = useMiniAppContext();
  const gameRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [gameInitialized, setGameInitialized] = useState(false);
  const [gameOverState, setGameOverState] = useState(false); // Track game over for blur effect
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(10);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [previousBestScore, setPreviousBestScore] = useState(() => parseInt(localStorage.getItem('candyCrushMaxScore') || '0'));
  const [gameKey, setGameKey] = useState<number>(0);
  
  // Internal loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInternalLoader, setShowInternalLoader] = useState(true);
  
  // Challenge system state
  const [challengeCandyType, setChallengeCandyType] = useState('1');
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeProgress, setChallengeProgress] = useState(0);

  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showNoMovesPopup, setShowNoMovesPopup] = useState(false);

  // Add reshuffles state
  const [reshuffles, setReshuffles] = useState(1);
  const reshuffleGridRef = useRef<null | (() => void)>(null);
  
  // Combo system state
  const [comboCount, setComboCount] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  
  // Daily limit countdown state
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

  // Game time tracking
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(0);

  // Score counting animation
  useEffect(() => {
    if (score > 0 && gameOver) {
      setAnimatedScore(0);
      const targetScore = score;
      const duration = 2000; // 2 seconds animation
      const steps = 60; // 60 steps for smooth animation
      const increment = targetScore / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedScore(targetScore);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(increment * currentStep));
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [score, gameOver]);

  // Daily limit countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      
      // Calculate next 5:30 AM IST
      // Create today's reset time: 5:30 AM IST = 00:00 UTC (midnight UTC)
      const todayResetUTC = new Date();
      todayResetUTC.setUTCHours(0, 0, 0, 0); // 00:00 UTC = 5:30 AM IST
      
      // Create tomorrow's reset time
      const tomorrowResetUTC = new Date(todayResetUTC);
      tomorrowResetUTC.setUTCDate(tomorrowResetUTC.getUTCDate() + 1);
      
      // Choose the next reset time
      const nextResetUTC = now < todayResetUTC ? todayResetUTC : tomorrowResetUTC;
      
      const timeLeft = nextResetUTC.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset('00h 00m 00s');
      }
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    setGameInitialized(false);
    setGameOver(false);
    setGameOverState(false); // Reset blur state
    setScore(0);
    setLevel(1);
    setMoves(10);
    setChallengeCandyType('1');
    setChallengeTarget(10);
    setChallengeProgress(0);
    setAnimatedScore(0);
    setPreviousBestScore(parseInt(localStorage.getItem('candyCrushMaxScore') || '0'));
    setGameKey((k: number) => k + 1); // Increment gameKey to remount game container
    setShowNoMovesPopup(false); // Reset no moves popup
    
    // Reset mint status to show "Mint NFT" button again
    setMintStatus('idle');
    setMintError('');
    setNftRecorded(false); // Reset NFT recording flag
    
    if (gameRef.current) {
      const existingGame = gameRef.current.querySelector('canvas');
      if (existingGame) {
        existingGame.remove();
      }
      initGame();
    }
  };

  const handleBackToMenu = () => {
    if (onBack) onBack();
  };

  // Calculate and set game duration
  const calculateGameDuration = () => {
    if (gameStartTime) {
      const duration = Math.floor((Date.now() - gameStartTime) / 1000); // Duration in seconds
      setGameDuration(duration);
      return duration;
    }
    return 0;
  };

  // Handle no moves popup actions
  const handleContinueSearching = () => {
    setShowNoMovesPopup(false);
    // Player can continue trying to find moves
  };

  const handleEndGameFromNoMoves = () => {
    setShowNoMovesPopup(false);
    // Calculate game duration
    const duration = calculateGameDuration();
    
    // Force end the game
    setGameOver(true);
    setGameOverState(true);
    
    // Store previous best score before updating
    const currentBest = parseInt(localStorage.getItem('candyBestScore') || '0');
    setPreviousBestScore(currentBest);
    
    // Update best score if current score is better
    if (score > currentBest) {
      localStorage.setItem('candyBestScore', score.toString());
    }
    
    // Submit score to database with duration
    if (context?.user?.fid && context?.user?.pfpUrl) {
      submitScoreToDatabase(context.user.fid, context.user.pfpUrl, context?.user?.username || 'Anonymous', score, level, duration);
    }
  };



  const CANDY_TYPES = ['1', '2', '3', '4', '5', '6'];

  useEffect(() => {
    if (gameRef.current) {
      setGameInitialized(false);
      setShowInternalLoader(true);
      setLoadingProgress(0);
      
      // Start internal loading animation
      const startLoading = async () => {
        // Step 1: Initialize Phaser (20%)
        setLoadingProgress(20);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 2: Load assets (40%)
        setLoadingProgress(40);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 3: Create game objects (60%)
        setLoadingProgress(60);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 4: Initialize grid (80%)
        setLoadingProgress(80);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 5: Final setup (100%)
        setLoadingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Hide loader and start game
        setShowInternalLoader(false);
        initGame();
      };
      
      // Start tracking game time
      setGameStartTime(Date.now());
      setGameDuration(0);
      // Reset mint status for new game
      setMintStatus('idle');
      setMintError('');
      setNftRecorded(false); // Reset NFT recording flag
      
      startLoading();
    }
    return () => {
      if (gameRef.current) {
        // Properly destroy Phaser game instance
        const phaserGame = (gameRef.current as any).phaserGame;
        if (phaserGame) {
          phaserGame.destroy(true);
        }
        
        // Remove any remaining canvas elements
        const canvas = gameRef.current.querySelector('canvas');
        if (canvas) canvas.remove();
      }
    };
  }, [gameKey]);

  const initGame = () => {
    let scene: Phaser.Scene;
    let grid: any[][] = [];
    let gameScore = 0;
    let gameLevel = level;
    let gameMoves = moves;
    let gameChallengeCandy = challengeCandyType;
    let gameChallengeTarget = challengeTarget;
    let gameChallengeProgress = challengeProgress;

    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    const CANDY_SIZE = 55; // Smaller candy size to create padding
    let CANDY_SPACING = 60; // Will be calculated based on screen width
    const CELL_PADDING = 7; // Padding inside each grid cell
    const GRID_PADDING = 20; // Padding around the entire grid
    let GRID_X = 0; // Will be calculated after scene creation
    const GRID_Y = 150;
    const CANDY_TYPES = ['1', '2', '3', '4', '5', '6'];

    class Candy extends Phaser.GameObjects.Sprite {
      gridX: number;
      gridY: number;
      candyType: string;
      debugBorder: Phaser.GameObjects.Graphics | null = null;

      constructor(scene: Phaser.Scene, x: number, y: number, gridX: number, gridY: number, type: string) {
        super(scene, x, y, 'candy-' + type);
        this.gridX = gridX;
        this.gridY = gridY;
        this.candyType = type;
        
        // Better scaling for crisp images
        this.setDisplaySize(CANDY_SIZE, CANDY_SIZE);
        this.setInteractive();
        scene.add.existing(this);
      }
      
      showCollisionBorder() {
        if (!this.debugBorder) {
          this.debugBorder = this.scene.add.graphics();
        }
        this.debugBorder.clear();
        this.debugBorder.lineStyle(3, 0xff0000, 1);
        this.debugBorder.strokeRect(this.x - CANDY_SIZE/2, this.y - CANDY_SIZE/2, CANDY_SIZE, CANDY_SIZE);
      }
      
      hideCollisionBorder() {
        if (this.debugBorder) {
          this.debugBorder.clear();
        }
      }
      
      destroy() {
        if (this.debugBorder) {
          this.debugBorder.destroy();
        }
        super.destroy();
      }
    }

    function preload(this: Phaser.Scene) {
      // Load all the meme images from candy folder
      CANDY_TYPES.forEach(type => {
        this.load.image('candy-' + type, `/candy/${type}.png`);
      });
      
      // Ensure images maintain quality when loaded
      this.load.on('filecomplete-image', (key: string) => {
        const texture = this.textures.get(key);
        if (texture) {
          // Set high quality filtering for each texture
          texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
        console.log('✅ Loaded high-quality meme image:', key);
      });
      
      // Log any errors but don't create fallbacks
      this.load.on('loaderror', (file: any) => {
        console.error('❌ Failed to load meme image:', file.key);
      });
    }

    function getMemeColor(type: string): number {
      const colors: { [key: string]: number } = {
        '1': 0xff4444,       // Red
        '2': 0x44ff44,       // Green  
        '3': 0x4444ff,       // Blue
        '4': 0xffff44,       // Yellow
        '5': 0xff44ff,       // Magenta
        '6': 0xff8844        // Orange
      };
      return colors[type] || 0xff0000;
    }

    // UI Text objects - store references so we can update them
    let scoreText: Phaser.GameObjects.Text | null = null;
    let levelText: Phaser.GameObjects.Text | null = null;
    let movesText: Phaser.GameObjects.Text | null = null;
    let challengeLabelText: Phaser.GameObjects.Text | null = null;
    let challengeText: Phaser.GameObjects.Text | null = null;
    let challengeIcon: Phaser.GameObjects.Sprite | null = null;
    let challengeBarBg: Phaser.GameObjects.Graphics | null = null;
    let challengeBarFill: Phaser.GameObjects.Graphics | null = null;
    let statusText: Phaser.GameObjects.Text | null = null;
    let currentProgressBarWidth = 0; // Track animated progress bar width

        function create(this: Phaser.Scene) {
      scene = this;
      
      // Calculate responsive grid dimensions after scene is initialized
      const availableWidth = this.cameras.main.width - (GRID_PADDING * 2);
      CANDY_SPACING = availableWidth / GRID_COLS;
      GRID_X = GRID_PADDING;
      
      // Create grid table lines with rounded corner awareness
      const gridLines = this.add.graphics();
      gridLines.lineStyle(2, 0xffffff, 0.5); // White lines, semi-transparent
      
      const cornerRadius = 15;
      const gridWidth = availableWidth;
      const gridHeight = GRID_ROWS * CANDY_SPACING;
      
      // Draw vertical grid lines (skip corners for rounded effect)
      for (let col = 1; col < GRID_COLS; col++) { // Skip first and last lines
        const x = GRID_X + col * CANDY_SPACING;
        gridLines.moveTo(x, GRID_Y + cornerRadius);
        gridLines.lineTo(x, GRID_Y + gridHeight - cornerRadius);
      }
      
      // Draw horizontal grid lines (skip corners for rounded effect)
      for (let row = 1; row < GRID_ROWS; row++) { // Skip first and last lines
        const y = GRID_Y + row * CANDY_SPACING;
        gridLines.moveTo(GRID_X + cornerRadius, y);
        gridLines.lineTo(GRID_X + gridWidth - cornerRadius, y);
      }
      
      gridLines.strokePath();
      
      initializeGrid();
      setupDragInput();
      
      // Add periodic collision detection for debugging
      this.time.addEvent({
        delay: 2000, // Check every 2 seconds
        callback: () => {
          debugGrid('PERIODIC CHECK');
          validateAndFixGrid();
        },
        loop: true
      });
      
            // Create UI text objects and store references (responsive positioning)
      const screenWidth = this.cameras.main.width;
      const centerX = screenWidth / 2;
      const progressBarWidth = Math.min(screenWidth - 40, 300); // Responsive progress bar width
      
      scoreText = this.add.text(centerX -60, 10, 'Score:0', { fontSize: '20px', color: 'black', fontStyle: 'bold' });
      movesText = this.add.text(screenWidth - 20, 10, 'Moves:10', { fontSize: '20px', color: 'black', fontStyle: 'bold' }).setOrigin(1, 0);
      
      // Level text above progress bar
      levelText = this.add.text(centerX, 40, 'Level: 1', { fontSize: '20px', color: 'black', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
      // Challenge display centered
     
      
      // Challenge progress bar centered
      challengeBarBg = this.add.graphics();
      challengeBarBg.fillStyle(0x333333, 0.3);
      challengeBarBg.fillRect(centerX - progressBarWidth/2, 60, progressBarWidth, 20); // Responsive background bar
      
      challengeBarFill = this.add.graphics();
      challengeBarFill.fillStyle(0x00aa00, 1);
      challengeBarFill.fillRect(centerX - progressBarWidth/2, 60, 0, 20); // Responsive progress fill (starts at 0 width)
      
            // Challenge text below progress bar
        challengeIcon = this.add.sprite(centerX - 40, 102, 'candy-' + gameChallengeCandy);
       challengeIcon.setDisplaySize(35,35); // Small icon size
        challengeText = this.add.text(centerX + 10, 100, '(0/10)', { fontSize: '17px', color: 'black', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
    
      
      // Initialize UI
      updateUI();

      // In initGame, after defining scene, add:
      scene.events.on('levelup', () => {
        setReshuffles(r => r + 1);
      });
    }

    // Function to update both React state and Phaser UI
    function updateUI() {
      // Update React state
      setScore(gameScore);
      setLevel(gameLevel);
      setMoves(gameMoves);
      setChallengeProgress(gameChallengeProgress);
      
      // Update Phaser text objects
      if (scoreText) scoreText.setText(`${gameScore}`);
      if (levelText) levelText.setText(`Level: ${gameLevel}`);
      if (movesText) movesText.setText(`Moves: ${gameMoves}`);
      // Update challenge display
      
      
      if (challengeText) {
        challengeText.setText(`(${gameChallengeProgress}/${gameChallengeTarget})`);
        
        // Color coding for progress
        if (gameChallengeProgress >= gameChallengeTarget) {
          challengeText.setColor('#00ff00'); // Bright green when complete
        } else if (gameChallengeProgress >= gameChallengeTarget * 0.7) {
          challengeText.setColor('#ffaa00'); // Bright orange when close
        } else {
          challengeText.setColor('#000000'); // White otherwise
        }
      }
      
      // Update challenge icon when candy type changes
      if (challengeIcon) {
        challengeIcon.setTexture('candy-' + gameChallengeCandy);
      }
      
      // Update challenge progress bar with smooth animation
      if (challengeBarFill) {
        const progressPercent = Math.min(gameChallengeProgress / gameChallengeTarget, 1);
        const centerX = scene.cameras.main.width / 2;
        const progressBarWidth = Math.min(scene.cameras.main.width - 40, 300);
        const targetWidth = progressBarWidth * progressPercent;
        
        // Color based on progress
        let barColor = 0x666666; // Gray for no progress
        if (progressPercent >= 1) {
          barColor = 0x00aa00; // Green when complete
        } else if (progressPercent >= 0.7) {
          barColor = 0xff8800; // Orange when close
        } else if (progressPercent > 0) {
          barColor = 0x3498db; // Blue for progress
        }
        
        // Animate the progress bar filling
        scene.tweens.add({
          targets: { width: currentProgressBarWidth },
          width: targetWidth,
          duration: 500, // 500ms smooth animation
          ease: 'Power2.out',
          onUpdate: (tween: any) => {
            currentProgressBarWidth = tween.targets[0].width;
            challengeBarFill!.clear();
            challengeBarFill!.fillStyle(barColor, 1);
            challengeBarFill!.fillRect(centerX - progressBarWidth/2, 60, currentProgressBarWidth, 20);
          },
          onComplete: () => {
            // Add a slight bounce effect when complete
            if (progressPercent >= 1) {
              scene.tweens.add({
                targets: challengeBarFill,
                scaleY: 1.2,
                duration: 150,
                ease: 'Back.out',
                yoyo: true
              });
            }
          }
        });
      }
      
      // Update status based on game state
      if (statusText) {
        if (!isGameStable) {
          statusText.setText('⏳ Processing...');
          statusText.setColor('#ffaa00');
        } else {
          statusText.setText('✅ Ready to play');
          statusText.setColor('#ffffff');
        }
      }
      
      // Check for challenge completion - auto advance to next level
      if (gameChallengeProgress >= gameChallengeTarget) {
        console.log('🎉 Challenge completed! Auto advancing to next level...');
        // Increment level and generate new challenge
        gameLevel++;
        scene.events.emit('levelup'); // <-- emit event for reshuffle
        // Calculate new challenge parameters
        const newChallengeTarget = 10 + (gameLevel - 1) * 5; // Start with 10, add 5 per level
        const newChallengeCandy = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
        // Add moves equal to the new challenge target
        gameMoves += newChallengeTarget;
        // Apply new challenge
        gameChallengeCandy = newChallengeCandy;
        gameChallengeTarget = newChallengeTarget;
        gameChallengeProgress = 0;
        console.log(`🎯 New Level ${gameLevel} Challenge: Match ${gameChallengeTarget} candies of type ${gameChallengeCandy}`);
        console.log(`💪 Bonus moves added: +${newChallengeTarget} (Total moves: ${gameMoves})`);
      }
    }

    function initializeGrid() {
      console.log('🎯 Initializing grid');
      
      // Clear any existing grid state
      grid = [];
      
      for (let row = 0; row < GRID_ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_COLS; col++) {
          const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          
          const candy = new Candy(scene, x, y, col, row, candyType);
          
          // Ensure position matches grid
          candy.gridX = col;
          candy.gridY = row;
          
          grid[row][col] = candy;
        }
      }
      
      // Validate initial grid state
      console.log('✅ Grid initialized, validating...');
      debugGrid('AFTER INITIALIZATION');
      validateAndFixGrid();
      
      // Game starts in stable state
      isGameStable = true;
      console.log('✅ Game initialized and stable');
      console.log(`🎯 Level ${gameLevel} Challenge: Match ${gameChallengeTarget} candies of type ${gameChallengeCandy}`);
      updateUI();
      
      // Mark game as fully initialized
      setTimeout(() => {
        setGameInitialized(true)
        
        // Dispatch event to notify that game is ready AFTER the background is rendered
        // Use a longer delay to ensure smooth transition
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gameInitialized'))
            window.dispatchEvent(new CustomEvent('phaserGameReady'))
          }
        }, 200); // Additional delay for visual elements to render
      }, 100); // Small delay to ensure rendering
    }

    // Touch/drag variables
    let isDragging = false;
    let dragStartCandy: Candy | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let isProcessingSwap = false; // Prevent multiple simultaneous swaps
    let isProcessingCascade = false; // Prevent multiple cascading operations
    let isGameStable = true; // Only allow swaps when game is stable

    function setupDragInput() {
      scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Only allow input when game is stable
        if (!isGameStable || isProcessingSwap || isProcessingCascade) {
          console.log('🚫 Input blocked - game not stable');
          return;
        }
        
        const candy = getCandyAtPosition(pointer.x, pointer.y);
        if (candy) {
          isDragging = true;
          dragStartCandy = candy;
          dragStartX = pointer.x;
          dragStartY = pointer.y;
          
          // Light vibration feedback when starting to drag
          triggerVibration([30]);
        }
      });

      scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (isDragging && dragStartCandy && gameMoves > 0 && !isProcessingSwap) {
          const deltaX = pointer.x - dragStartX;
          const deltaY = pointer.y - dragStartY;
          const minDragDistance = 25; // Slightly increased for better recognition

          if (Math.abs(deltaX) > minDragDistance || Math.abs(deltaY) > minDragDistance) {
            // Determine swipe direction - only allow one direction
            let targetCol = dragStartCandy.gridX;
            let targetRow = dragStartCandy.gridY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              // Horizontal swipe - only move horizontally
              if (deltaX > 0) {
                targetCol = dragStartCandy.gridX + 1; // Right
              } else {
                targetCol = dragStartCandy.gridX - 1; // Left
              }
            } else {
              // Vertical swipe - only move vertically  
              if (deltaY > 0) {
                targetRow = dragStartCandy.gridY + 1; // Down
              } else {
                targetRow = dragStartCandy.gridY - 1; // Up
              }
            }

            // Validate bounds and ensure target exists
            if (targetCol >= 0 && targetCol < GRID_COLS && 
                targetRow >= 0 && targetRow < GRID_ROWS) {
              const targetCandy = grid[targetRow][targetCol];
              if (targetCandy && areAdjacent(dragStartCandy, targetCandy)) {
                swapCandies(dragStartCandy, targetCandy);
              }
            }
          }
        }

        isDragging = false;
        dragStartCandy = null;
      });
    }

    function getCandyAtPosition(x: number, y: number): Candy | null {
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            const candyBounds = candy.getBounds();
            if (candyBounds.contains(x, y)) {
              return candy;
            }
          }
        }
      }
      return null;
    }

    function triggerVibration(pattern: number[]) {
      // Check if vibration is supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch (error) {
          console.log('Vibration not supported on this device');
        }
      }
    }

    function areAdjacent(candy1: Candy, candy2: Candy): boolean {
      const dx = Math.abs(candy1.gridX - candy2.gridX);
      const dy = Math.abs(candy1.gridY - candy2.gridY);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    function checkSwapValidity(candy1: Candy, candy2: Candy): boolean {
      // Temporarily perform the swap to check if it creates matches
      const originalCandy1Pos = { gridX: candy1.gridX, gridY: candy1.gridY };
      const originalCandy2Pos = { gridX: candy2.gridX, gridY: candy2.gridY };
      
      // Temporarily swap grid positions
      grid[candy1.gridY][candy1.gridX] = candy2;
      grid[candy2.gridY][candy2.gridX] = candy1;
      
      candy1.gridX = originalCandy2Pos.gridX;
      candy1.gridY = originalCandy2Pos.gridY;
      candy2.gridX = originalCandy1Pos.gridX;
      candy2.gridY = originalCandy1Pos.gridY;
      
      // Check if this creates any matches
      const isValid = checkForMatchesAfterSwap();
      
      // Immediately revert the temporary swap
      grid[candy2.gridY][candy2.gridX] = candy1;
      grid[candy1.gridY][candy1.gridX] = candy2;
      
      candy1.gridX = originalCandy1Pos.gridX;
      candy1.gridY = originalCandy1Pos.gridY;
      candy2.gridX = originalCandy2Pos.gridX;
      candy2.gridY = originalCandy2Pos.gridY;
      
      return isValid;
    }

    function swapCandies(candy1: Candy, candy2: Candy) {
      if (isProcessingSwap || !isGameStable) return; // Prevent simultaneous swaps and ensure stability
      isProcessingSwap = true;
      isGameStable = false; // Mark game as unstable during swap
      updateUI(); // Update status immediately
      
      console.log(`🔄 Checking swap validity for [${candy1.gridY}][${candy1.gridX}] and [${candy2.gridY}][${candy2.gridX}]`);
      
      // Validate positions before any changes
      if (grid[candy1.gridY][candy1.gridX] !== candy1) {
        console.error(`🔴 SWAP ERROR: Candy1 not at expected position [${candy1.gridY}][${candy1.gridX}]`);
        isProcessingSwap = false;
        return;
      }
      if (grid[candy2.gridY][candy2.gridX] !== candy2) {
        console.error(`🔴 SWAP ERROR: Candy2 not at expected position [${candy2.gridY}][${candy2.gridX}]`);
        isProcessingSwap = false;
        return;
      }
      
      // Check if swap is valid BEFORE making any changes
      if (!checkSwapValidity(candy1, candy2)) {
        console.log(`❌ Invalid swap - no matches created, showing revert animation`);
        
        // Store original positions for revert animation
        const originalCandy1 = { x: candy1.x, y: candy1.y };
        const originalCandy2 = { x: candy2.x, y: candy2.y };
        
        // Calculate target positions for the "attempted" swap
        const candy1NewX = GRID_X + candy2.gridX * CANDY_SPACING + CANDY_SPACING / 2;
        const candy1NewY = GRID_Y + candy2.gridY * CANDY_SPACING + CANDY_SPACING / 2;
        const candy2NewX = GRID_X + candy1.gridX * CANDY_SPACING + CANDY_SPACING / 2;
        const candy2NewY = GRID_Y + candy1.gridY * CANDY_SPACING + CANDY_SPACING / 2;
        
        // Animate the "attempted" swap
        scene.tweens.add({
          targets: candy1,
          x: candy1NewX,
          y: candy1NewY,
          duration: 150
        });
        
        scene.tweens.add({
          targets: candy2,
          x: candy2NewX,
          y: candy2NewY,
          duration: 150,
          onComplete: () => {
            // Now animate back to original positions
            triggerVibration([50, 50]); // Double short vibration for invalid swap
            
            scene.tweens.add({
              targets: candy1,
              x: originalCandy1.x,
              y: originalCandy1.y,
              duration: 150,
              ease: 'Back.out'
            });
            
            scene.tweens.add({
              targets: candy2,
              x: originalCandy2.x,
              y: originalCandy2.y,
              duration: 150,
              ease: 'Back.out',
              onComplete: () => {
                isProcessingSwap = false;
                isGameStable = true; // Game is stable again after invalid swap
                console.log('✅ Game stable - invalid swap completed');
                updateUI(); // Update status
              }
            });
          }
        });
        return;
      }
      
      console.log(`✅ Valid swap detected - proceeding with actual swap`);
      
      // Store original positions 
      const originalCandy1 = { gridX: candy1.gridX, gridY: candy1.gridY, x: candy1.x, y: candy1.y };
      const originalCandy2 = { gridX: candy2.gridX, gridY: candy2.gridY, x: candy2.x, y: candy2.y };
      
      // Now perform the actual swap (we know it's valid)
      grid[candy1.gridY][candy1.gridX] = candy2;
      grid[candy2.gridY][candy2.gridX] = candy1;
      
      candy1.gridX = candy2.gridX;
      candy1.gridY = candy2.gridY;
      candy2.gridX = originalCandy1.gridX;
      candy2.gridY = originalCandy1.gridY;
      
      const candy1NewX = GRID_X + candy1.gridX * CANDY_SPACING + CANDY_SPACING / 2;
      const candy1NewY = GRID_Y + candy1.gridY * CANDY_SPACING + CANDY_SPACING / 2;
      const candy2NewX = GRID_X + candy2.gridX * CANDY_SPACING + CANDY_SPACING / 2;
      const candy2NewY = GRID_Y + candy2.gridY * CANDY_SPACING + CANDY_SPACING / 2;
      
      // Animate the swap
      scene.tweens.add({
        targets: candy1,
        x: candy1NewX,
        y: candy1NewY,
        duration: 200
      });
      
      scene.tweens.add({
        targets: candy2,
        x: candy2NewX,
        y: candy2NewY,
        duration: 200,
        onComplete: () => {
          debugGrid('AFTER VALID SWAP ANIMATION');
          
          // We already know this creates matches, so proceed directly
          triggerVibration([100]); // Short vibration for successful swap
          gameMoves--;
          updateUI();
          debugGrid('BEFORE MATCH CHECK');
          checkForMatches();
          isProcessingSwap = false; // Clear flag after successful swap
          // Note: isGameStable will be set to true after all cascading completes
        }
      });
    }



    function showInvalidMoveEffect() {
      // Create a brief "X" or "Invalid" text effect
      const centerX = scene.cameras.main.width / 2;
      const centerY = scene.cameras.main.height / 2;
      const invalidText = scene.add.text(centerX, centerY, '❌', {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0);
      
      scene.tweens.add({
        targets: invalidText,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        onComplete: () => invalidText.destroy()
      });
    }

    function checkForMatchesAfterSwap(): boolean {
      // Same logic as checkForMatches but only returns true/false
      const matches: Candy[] = [];
      
      // Check horizontal matches
      for (let row = 0; row < GRID_ROWS; row++) {
        let count = 1;
        let currentType = grid[row][0]?.candyType;
        
        for (let col = 1; col < GRID_COLS; col++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = col - count; i < col; i++) {
                if (!matches.includes(grid[row][i])) {
                  matches.push(grid[row][i]);
                }
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_COLS - count; i < GRID_COLS; i++) {
            if (!matches.includes(grid[row][i])) {
              matches.push(grid[row][i]);
            }
          }
        }
      }
      
      // Check vertical matches
      for (let col = 0; col < GRID_COLS; col++) {
        let count = 1;
        let currentType = grid[0][col]?.candyType;
        
        for (let row = 1; row < GRID_ROWS; row++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = row - count; i < row; i++) {
                if (!matches.includes(grid[i][col])) {
                  matches.push(grid[i][col]);
                }
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_ROWS - count; i < GRID_ROWS; i++) {
            if (!matches.includes(grid[i][col])) {
              matches.push(grid[i][col]);
            }
          }
        }
      }
      
      return matches.length > 0;
    }

    // Function to check if there are any possible moves left
    function checkForPossibleMoves(): boolean {
      console.log('🔍 Checking for possible moves...');
      
      // Check all possible adjacent swaps
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const currentCandy = grid[row][col];
          if (!currentCandy) continue;
          
          // Check right swap
          if (col < GRID_COLS - 1) {
            const rightCandy = grid[row][col + 1];
            if (rightCandy) {
              // Temporarily swap
              grid[row][col] = rightCandy;
              grid[row][col + 1] = currentCandy;
              
              // Check if this swap creates matches
              const hasMatches = checkForMatchesAfterSwap();
              
              // Swap back
              grid[row][col] = currentCandy;
              grid[row][col + 1] = rightCandy;
              
              if (hasMatches) {
                console.log(`✅ Found possible move at (${row},${col}) -> (${row},${col + 1})`);
                return true;
              }
            }
          }
          
          // Check down swap
          if (row < GRID_ROWS - 1) {
            const downCandy = grid[row + 1][col];
            if (downCandy) {
              // Temporarily swap
              grid[row][col] = downCandy;
              grid[row + 1][col] = currentCandy;
              
              // Check if this swap creates matches
              const hasMatches = checkForMatchesAfterSwap();
              
              // Swap back
              grid[row][col] = currentCandy;
              grid[row + 1][col] = downCandy;
              
              if (hasMatches) {
                console.log(`✅ Found possible move at (${row},${col}) -> (${row + 1},${col})`);
                return true;
              }
            }
          }
        }
      }
      
      console.log('❌ No possible moves found');
      return false;
    }

    function checkForMatches() {
      const matches: Candy[] = [];
      
      // Check horizontal matches
      for (let row = 0; row < GRID_ROWS; row++) {
        let count = 1;
        let currentType = grid[row][0]?.candyType;
        
        for (let col = 1; col < GRID_COLS; col++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = col - count; i < col; i++) {
                matches.push(grid[row][i]);
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_COLS - count; i < GRID_COLS; i++) {
            matches.push(grid[row][i]);
          }
        }
      }
      
      // Check vertical matches
      for (let col = 0; col < GRID_COLS; col++) {
        let count = 1;
        let currentType = grid[0][col]?.candyType;
        
        for (let row = 1; row < GRID_ROWS; row++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = row - count; i < row; i++) {
                matches.push(grid[i][col]);
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_ROWS - count; i < GRID_ROWS; i++) {
            matches.push(grid[i][col]);
          }
        }
      }
      
      if (matches.length > 0) {
        removeMatches(matches);
      } else {
        // No more matches found - game is now stable
        isGameStable = true;
        console.log('✅ Game stable - no more matches found');
        
        // Reset combo when no matches are found
        setComboCount(0);
        
        updateUI(); // Update status
        
        if (gameMoves <= 0) {
          // Store previous best score before updating
          const currentBest = parseInt(localStorage.getItem('candyBestScore') || '0');
          setPreviousBestScore(currentBest);
          
          // Update best score if current score is better
          if (gameScore > currentBest) {
            localStorage.setItem('candyBestScore', gameScore.toString());
          }
          
          setGameOver(true);
          setGameOverState(true); // Set blur state
          
          // Calculate game duration
          const duration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
          setGameDuration(duration);
          
          // Submit score to database
          if (context?.user?.fid && context?.user?.pfpUrl) {
            submitScoreToDatabase(context.user.fid, context.user.pfpUrl, context?.user?.username || 'Anonymous', gameScore, level, duration);
          }
          
        } else {
          // Check for possible moves when moves are available but no matches found
          const hasPossibleMoves = checkForPossibleMoves();
          if (!hasPossibleMoves) {
            console.log('🚫 No possible moves detected - showing popup');
            setShowNoMovesPopup(true);
          }
        }
      }
    }

    function removeMatches(matches: Candy[]) {
      // Count challenge candies in this match
      let challengeCandiesMatched = 0;
      matches.forEach(candy => {
        if (candy && candy.candyType === gameChallengeCandy) {
          challengeCandiesMatched++;
        }
      });
      
      // Update challenge progress
      gameChallengeProgress += challengeCandiesMatched;
      console.log(`🍭 Challenge progress: ${challengeCandiesMatched} candies of type ${gameChallengeCandy} matched (${gameChallengeProgress}/${gameChallengeTarget})`);
      
      // Increment combo count
      setComboCount(prev => prev + 1);
      
      // Calculate combo bonus score
      const comboMultiplier = Math.min(comboCount + 1, 5); // Cap at 5x
      const baseScore = matches.length * 100;
      const comboBonus = baseScore * (comboMultiplier - 1);
      const totalScore = baseScore + comboBonus;
      
      gameScore += totalScore;
      updateUI();
      
      console.log(`💥 Removing ${matches.length} matches (Combo: ${comboMultiplier}x, Score: +${totalScore})`);
      
      // Show combo animation only for 2x+ combos
      if (comboCount + 1 >= 2) {
        setShowComboAnimation(true);
        setTimeout(() => setShowComboAnimation(false), 2000);
      }
      
      // Vibrate based on match size and combo - bigger matches and combos = longer vibration
      const vibrationIntensity = Math.min(matches.length * 30 + (comboCount * 20), 300);
      triggerVibration([vibrationIntensity]);
      
      debugGrid('BEFORE MATCH REMOVAL');
      
      // Clear grid positions immediately and validate
      matches.forEach(candy => {
        console.log(`🗑️ Clearing candy at [${candy.gridY}][${candy.gridX}]`);
        
        // Validate the candy is actually at the expected position
        if (grid[candy.gridY][candy.gridX] !== candy) {
          console.error(`🔴 REMOVE ERROR: Expected candy at [${candy.gridY}][${candy.gridX}] but found different candy`);
          debugGrid('ERROR STATE');
        }
        
        grid[candy.gridY][candy.gridX] = null;
      });
      
      debugGrid('AFTER MATCH REMOVAL');
      
      // Enhanced destruction animation
      let completedAnimations = 0;
      matches.forEach((candy, index) => {
        // Enhanced candy destruction animation with rotation and scaling
        scene.tweens.add({
          targets: candy,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          rotation: Math.PI * 2, // Full rotation
          duration: 300,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            candy.destroy();
            completedAnimations++;
            
            // Only proceed when ALL removal animations are done
            if (completedAnimations === matches.length) {
              debugGrid('BEFORE CASCADE');
              animatedCascade();
            }
          }
        });
        
        // Stagger the animations slightly for better visual effect
        scene.time.delayedCall(index * 50, () => {
          candy.setVisible(true);
        });
      });
    }

    function reconstructGrid() {
      console.log('🔧 EMERGENCY: Reconstructing entire grid to fix collisions');
      
      // Collect all valid candy objects currently in the scene
      const allCandies: Candy[] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (grid[row][col] && grid[row][col].active) {
            allCandies.push(grid[row][col]);
          }
        }
      }
      
      // Clear grid completely
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          grid[row][col] = null;
        }
      }
      
      // Sort candies by their visual Y position (bottom to top)
      allCandies.sort((a, b) => b.y - a.y);
      
      // Place candies column by column from bottom up
      const columnCandies: { [col: number]: Candy[] } = {};
      
      // Group candies by column
      allCandies.forEach(candy => {
        const col = Math.round((candy.x - GRID_X - CANDY_SPACING / 2) / CANDY_SPACING);
        if (col >= 0 && col < GRID_COLS) {
          if (!columnCandies[col]) columnCandies[col] = [];
          columnCandies[col].push(candy);
        }
      });
      
      // Place candies in grid from bottom up
      for (let col = 0; col < GRID_COLS; col++) {
        const candiesInCol = columnCandies[col] || [];
        
        for (let i = 0; i < candiesInCol.length && i < GRID_ROWS; i++) {
          const row = GRID_ROWS - 1 - i;
          const candy = candiesInCol[i];
          
          grid[row][col] = candy;
          candy.gridX = col;
          candy.gridY = row;
          
          // Snap to correct position
          const correctX = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const correctY = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          candy.setPosition(correctX, correctY);
        }
        
        // Remove excess candies if any
        for (let i = GRID_ROWS; i < candiesInCol.length; i++) {
          candiesInCol[i].destroy();
        }
      }
      
      // Fill any remaining empty spaces
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (!grid[row][col]) {
            const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
            const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
            const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
            
            const candy = new Candy(scene, x, y, col, row, candyType);
            grid[row][col] = candy;
          }
        }
      }
      
      console.log('✅ Grid reconstruction complete');
    }

    function debugGrid(context: string) {
      console.log(`🔍 GRID DEBUG (${context}):`);
      
      // Check for null entries
      let nullCount = 0;
      let candyCount = 0;
      const visualPositions = new Map();
      
      for (let row = 0; row < GRID_ROWS; row++) {
        let rowStr = '';
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            candyCount++;
            rowStr += `[${candy.candyType}]`;
            
            // Check visual position
            const visualKey = `${Math.round(candy.x)}-${Math.round(candy.y)}`;
            if (visualPositions.has(visualKey)) {
              console.error(`🔴 VISUAL COLLISION: Two candies at visual position ${visualKey}`);
              console.error(`   Candy 1: [${visualPositions.get(visualKey).gridY}][${visualPositions.get(visualKey).gridX}]`);
              console.error(`   Candy 2: [${candy.gridY}][${candy.gridX}]`);
              
              // Show red borders on colliding candies
              visualPositions.get(visualKey).showCollisionBorder();
              candy.showCollisionBorder();
            } else {
              // Hide border if no collision
              candy.hideCollisionBorder();
            }
            visualPositions.set(visualKey, candy);
            
            // Check grid sync
            if (candy.gridX !== col || candy.gridY !== row) {
              console.error(`🔴 GRID DESYNC: Candy at [${row}][${col}] thinks it's at [${candy.gridY}][${candy.gridX}]`);
            }
          } else {
            nullCount++;
            rowStr += '[ ]';
          }
        }
        console.log(`Row ${row}: ${rowStr}`);
      }
      
      console.log(`📊 Total: ${candyCount} candies, ${nullCount} empty spaces`);
      
      // Check for duplicates in grid array
      const gridCandies = new Set();
      let duplicatesFound = false;
      
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            if (gridCandies.has(candy)) {
              console.error(`🔴 DUPLICATE CANDY REFERENCE: Same candy object in multiple grid positions`);
              duplicatesFound = true;
            }
            gridCandies.add(candy);
          }
        }
      }
      
      return { candyCount, nullCount, duplicatesFound };
    }

    function validateAndFixGrid() {
      const debug = debugGrid('VALIDATION');
      
      if (debug.duplicatesFound) {
        console.error('🚨 CRITICAL: Duplicate candy references found - forcing reconstruction');
        reconstructGrid();
        return false;
      }
      
      return true;
    }

    function animatedCascade() {
      if (isProcessingCascade) {
        console.log('⏸️ Cascade already in progress, skipping');
        return;
      }
      
      isProcessingCascade = true;
      console.log('🌊 Starting natural cascade');
      
      // Stop all tweens first
      scene.tweens.killAll();
      
      // Check for and fix any collisions
      if (!validateAndFixGrid()) {
        // Grid was reconstructed, check for matches again
        isProcessingCascade = false;
        scene.time.delayedCall(100, () => checkForMatches());
        return;
      }
      
      let totalAnimations = 0;
      let completedAnimations = 0;
      
      // Process each column with natural gravity
      for (let col = 0; col < GRID_COLS; col++) {
        console.log(`🔽 Processing column ${col}`);
        
        // Scan from bottom to top, filling empty spaces
        for (let row = GRID_ROWS - 1; row >= 0; row--) {
          if (grid[row][col] === null) {
            // Found empty space, look for candy above to fall down
            let foundCandyRow = -1;
            for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
              if (grid[searchRow][col] !== null) {
                foundCandyRow = searchRow;
                break;
              }
            }
            
            if (foundCandyRow >= 0) {
              // Move candy from foundCandyRow to row
              const fallingCandy = grid[foundCandyRow][col];
              grid[foundCandyRow][col] = null;
              grid[row][col] = fallingCandy;
              
              // Update candy's grid position
              fallingCandy!.gridX = col;
              fallingCandy!.gridY = row;
              
              const newY = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
              
              // Animate the fall
              totalAnimations++;
              const fallDistance = row - foundCandyRow;
              console.log(`📉 Candy falling from row ${foundCandyRow} to row ${row} (distance: ${fallDistance})`);
              
              scene.tweens.add({
                targets: fallingCandy,
                y: newY,
                duration: 150 + (fallDistance * 50), // Longer falls take more time
                ease: 'Power2.out',
                onComplete: () => {
                  completedAnimations++;
                  checkAllAnimationsComplete();
                }
              });
            }
          }
        }
        
        // After all existing candies have fallen, add new candies at the top
        let newCandiesNeeded = 0;
        for (let row = 0; row < GRID_ROWS; row++) {
          if (grid[row][col] === null) {
            newCandiesNeeded++;
          }
        }
        
        if (newCandiesNeeded > 0) {
          console.log(`➕ Adding ${newCandiesNeeded} new candies to column ${col}`);
          
          let addedCandies = 0;
          for (let row = 0; row < GRID_ROWS; row++) {
            if (grid[row][col] === null) {
              const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
              const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
              const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
              
              // Start candy above the grid
              const startY = y - CANDY_SPACING * (newCandiesNeeded + 2);
              const candy = new Candy(scene, x, startY, col, row, candyType);
              grid[row][col] = candy;
              
              totalAnimations++;
              
              scene.tweens.add({
                targets: candy,
                y: y,
                duration: 200 + (addedCandies * 30), // Stagger new candies
                ease: 'Bounce.out',
                delay: 100, // Small delay to let existing candies fall first
                onComplete: () => {
                  completedAnimations++;
                  checkAllAnimationsComplete();
                }
              });
              
              addedCandies++;
            }
          }
        }
      }
      
      // If no animations needed, proceed immediately
      if (totalAnimations === 0) {
        console.log('📭 No cascade animations needed');
        finalizeCascade();
        return;
      }
      
      console.log(`📊 Starting ${totalAnimations} natural cascade animations`);
      
      function checkAllAnimationsComplete() {
        if (completedAnimations >= totalAnimations) {
          console.log(`✅ All ${totalAnimations} cascade animations completed`);
          finalizeCascade();
        }
      }
      
      function finalizeCascade() {
        // Final validation
        debugGrid('AFTER CASCADE');
        validateAndFixGrid();
        
        isProcessingCascade = false;
        
        // Check for matches after brief delay
        scene.time.delayedCall(150, () => {
          console.log('🔍 Cascade complete, checking matches');
          debugGrid('BEFORE NEXT MATCH CHECK');
          checkForMatches();
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      transparent: true, // Make canvas transparent to show CSS background
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: window.devicePixelRatio || 1

      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
        batchSize: 4096,
        mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create
      }
    };

    const game = new Phaser.Game(config);
    
    // Store game instance for cleanup
    if (gameRef.current) {
      (gameRef.current as any).phaserGame = game;
    }

    // Add reshuffleGrid function in Phaser logic and expose to React
    function reshuffleGrid() {
      // Animate all candies falling down and fading out
      let total = 0, done = 0;
      // Vibrate for reshuffle start
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            total++;
            scene.tweens.add({
              targets: candy,
              y: candy.y + 300,
              alpha: 0,
              duration: 350,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                candy.destroy();
                done++;
                if (done === total) {
                  // After all candies are gone, refill grid with new candies from above
                  refillGridWithAnimation();
                }
              }
            });
          }
          grid[row][col] = null;
        }
      }
      // If grid was empty (shouldn't happen), just refill
      if (total === 0) refillGridWithAnimation();
    }

    function refillGridWithAnimation() {
      let total = GRID_ROWS * GRID_COLS;
      let landed = 0;
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const newType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const yStart = -100;
          const yEnd = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          const candy = new Candy(scene, x, yStart, col, row, newType);
          candy.alpha = 0;
          grid[row][col] = candy;
          scene.tweens.add({
            targets: candy,
            y: yEnd,
            alpha: 1,
            duration: 400,
            delay: 60 * row + 20 * col,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              landed++;
              // Vibrate for each candy landing (short pulse)
              if ('vibrate' in navigator) {
                navigator.vibrate(10);
              }
              // When the last candy animates in, update UI and check for matches
              if (landed === total) {
                updateUI();
                checkForMatches();
              }
            }
          });
        }
      }
    }
    // Expose to React
    reshuffleGridRef.current = reshuffleGrid;
  };

  // Simplified background animation data for better performance
  const backgroundElements = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const candyColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#ff8844'];
      const elements = ['✨', '♥', '★', '○'];
      return {
        id: i,
        element: elements[i % elements.length],
        color: candyColors[Math.floor(Math.random() * candyColors.length)],
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 4}s`,
        opacity: Math.random() * 0.4 + 0.2,
        size: Math.random() * 4 + 6,
      };
    }),
    []
  );

  const { address } = useAccount();

  // Faucet state
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'checking' | 'claiming' | 'success' | 'error'>('idle');
  const [faucetError, setFaucetError] = useState<string>('');
  const [faucetClaimed, setFaucetClaimed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('faucetClaimed') === 'true';
    }
    return false;
  });

  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [nftRecorded, setNftRecorded] = useState(false);

  // Open popup whenever mint status changes away from idle
  useEffect(() => {
    if (mintStatus !== 'idle') setShowMintPopup(true);
  }, [mintStatus]);
  const [mintError, setMintError] = useState<string>('');
  const { writeContract: mintNFT, data: mintData, isError: isMintError, error: mintErrorObj } = useContractWrite();
  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintData });

  // Contract reads for supply and daily limits
  const { data: totalSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'getCurrentTokenId',
    query: { enabled: !!address }
  });

  const { data: contractRemainingSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'getRemainingSupply',
    query: { enabled: !!address }
  });

  const { data: canMintToday } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'canMintToday',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: remainingMintsToday } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'getRemainingMintsToday',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // On game over, show NFT minting option and check for faucet
  useEffect(() => {
    if (gameOver && address) {
      // Calculate final game duration
      const finalDuration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : gameDuration;
      
      // Submit score to database if we have valid user data
      if (context?.user?.fid && context?.user?.pfpUrl) {
        submitScoreToDatabase(context.user.fid, context.user.pfpUrl, context.user.username || 'Anonymous', score, level, finalDuration, address);
      } else {
        console.log('Cannot submit score: Missing FID or pfpUrl', {
          fid: context?.user?.fid,
          pfpUrl: context?.user?.pfpUrl
        });
      }

      // Check for faucet eligibility
      checkFaucetEligibility();
    }
  }, [gameOver, address, gameStartTime, gameDuration]);

  // Check if user is eligible for faucet
  const checkFaucetEligibility = async () => {
    if (!address || faucetClaimed) return;

    // setFaucetStatus('checking');
    setFaucetError('');

    try {
      // Check wallet balance using ethers.js
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const balance = await provider.getBalance(address);
      
      console.log("Wallet balance:", ethers.formatEther(balance), "ETH");
      
      // Only proceed if balance is 0
      if (balance > BigInt(0)) {
        setFaucetStatus('idle');
        return; // User has balance, no need for faucet
      }

      // Set status to claiming since balance is 0
      setFaucetStatus('claiming');

      // Check if user has already claimed faucet from database
      const { authenticatedFetch } = await import('@/lib/auth');
      const response = await authenticatedFetch('/api/faucet', {
        method: 'POST',
        body: JSON.stringify({ userAddress: address })
      });

      const result = await response.json();
      
      if (result.success) {
        // Faucet claimed successfully
        setFaucetStatus('success');
        setFaucetClaimed(true);
        localStorage.setItem('faucetClaimed', 'true');
        
        // Update gameScores to mark faucet as claimed
        if (context?.user?.fid) {
          const scoreResponse = await authenticatedFetch('/api/submit-score', {
            method: 'POST',
            body: JSON.stringify({
              fid: context.user.fid,
              pfpUrl: context.user.pfpUrl,
              username: context.user.username || 'Anonymous',
              score: score,
              level: level,
              duration: gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : gameDuration,
              userAddress: address,
              faucetClaimed: true
            })
          });
        }
      } else {
        // Check if it's a 409 status (already claimed)
        if (response.status === 409) {
          setFaucetClaimed(true);
          localStorage.setItem('faucetClaimed', 'true');
          setFaucetStatus('idle');
          return;
        }
        
        setFaucetStatus('error');
        setFaucetError(result.error || 'Failed to claim faucet');
      }
          } catch (error: any) {
        console.error('Error checking faucet eligibility:', error);
        
        // Handle network errors or other issues
        setFaucetStatus('error');
        setFaucetError('Failed to check faucet eligibility. Please try again.');
      }
  };

  // Handle NFT minting
  const submitScoreToDatabase = async (fid: number, pfpUrl: string, username: string, gameScore: number, gameLevel: number, gameDurationSeconds?: number, userAddress?: string) => {
    try {
      const { authenticatedFetch } = await import('@/lib/auth');
      const response = await authenticatedFetch('/api/submit-score', {
        method: 'POST',
        body: JSON.stringify({
          fid,
          pfpUrl,
          username,
          score: gameScore,
          level: gameLevel,
          duration: gameDurationSeconds || 0,
          userAddress
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to submit score:', result.error);
      } else {
        console.log('Score submitted successfully:', result.data);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const handleShareNFT = async () => {
    try {
      const supplyText = contractRemainingSupply ? `Still ${Number(contractRemainingSupply)} NFTs left 👀` : "Limited NFTs available 👀";
      
      await actions?.composeCast({
        text: `Just snagged a ChainCrush NFT with a score of ${score} 💥 \n\n${supplyText}\n\nYour turn to flex — play, score, and mint yours 🚀🎮✨`,
        embeds: [APP_URL || '']
      });
      
      // Close the popup after sharing
      setShowMintPopup(false);
    } catch (error) {
      console.error('Failed to share NFT:', error);
    }
  };

  const handleMintNFT = async () => {
    if (!address) return;

    setMintStatus('minting');
    setMintError('');
    setNftRecorded(false); // Reset the flag for new minting attempt

    try {
      // Get signature from server
      const { authenticatedFetch } = await import('@/lib/auth');
      const response = await authenticatedFetch('/api/mint-nft', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          score: score
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Mint NFT
      mintNFT({
        address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
        abi: CHAINCRUSH_NFT_ABI,
        functionName: 'mintNFT',
        args: [
          BigInt(score),
          BigInt(result.data.timestamp),
          result.data.signature as `0x${string}`
        ]
      });
    } catch (error: any) {
      setMintStatus('error');
      setMintError(error.message || 'Failed to mint NFT');
    }
  };

  // Handle mint success/error
  useEffect(() => {
    if (mintSuccess && !nftRecorded) {
      setMintStatus('success');
      setNftRecorded(true); // Prevent duplicate calls
      
      // Record NFT minting in database
      const recordNftMint = async () => {
        try {
          const { authenticatedFetch } = await import('@/lib/auth');
          const nftName = `ChainCrush NFT #${score}`;
          
          await authenticatedFetch('/api/nft-minted', {
            method: 'POST',
            body: JSON.stringify({
              fid: context.user.fid,
              nftName
            })
          });
          
          console.log('NFT minting recorded successfully');
        } catch (error) {
          console.error('Failed to record NFT minting:', error);
        }
      };
      
      recordNftMint();
    } else if (isMintError) {
      setMintStatus('error');
      setMintError(mintErrorObj?.message || 'Minting failed');
    }
  }, [mintSuccess, isMintError, mintErrorObj, nftRecorded]);



  

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: gameInitialized 
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      
      {/* Minimal Elegant Background */}
      {gameInitialized && (
        <div
          className={gameOver ? 'bg-paused' : ''}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          {/* Simplified floating elements */}
          {backgroundElements.map((element) => (
            <div
              key={`bg-${element.id}`}
              className="float-element"
              style={{
                position: 'absolute',
                left: element.left,
                top: element.top,
                color: element.color,
                fontSize: `${element.size}px`,
                opacity: element.opacity,
                animationDelay: element.animationDelay,
                pointerEvents: 'none',
                willChange: 'transform',
              }}
            >
              {element.element}
            </div>
          ))}
          
          {/* Subtle gradient overlay for depth */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}
      
      {/* Modern Loading Screen */}
      {showInternalLoader && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '40px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Logo or Icon */}
            
            
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '30px',
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '0.5px'
            }}>
              Loading Chain Crush
            </div>
            
            {/* Modern Progress Bar */}
            <div style={{
              width: '280px',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ffffff, #f093fb)',
                borderRadius: '3px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}></div>
            </div>
            
            {/* Progress Percentage */}
            <div style={{
              fontSize: '14px',
              marginTop: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '500',
              letterSpacing: '1px'
            }}>
              {loadingProgress}%
            </div>
          </div>
        </div>
      )}
      
      <div
        key={gameKey}
        ref={gameRef}
        style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, filter: gameOverState ? 'blur(10px)' : 'none', transition: 'filter 0.5s ease'}}
      />
      


      {gameOver && (
        <>
          {/* Back to Games Button - Top Left */}
          <button
            style={{
              position: 'fixed',
              top: '2px',
              left: '0px',
              zIndex: 2100,
              padding: '8px 16px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onClick={handleBackToMenu}
          >
            ◀ Home
          </button>
          {/* Game Over Content */}
          <div style={{
            position: 'fixed',
            top: -25,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            pointerEvents: 'none' // Allow clicks to pass through except for button
          }}>
            {/* Modern Game Over Text */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
             
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0',
                textAlign: 'center',
                letterSpacing: '1px',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}>
                GAME OVER!
              </h1>
            </div>

            {/* Faucet Notification */}
            {address && faucetStatus !== 'idle' && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3000,
                pointerEvents: 'auto'
              }}>
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid',
                  borderColor: faucetStatus === 'success' ? '#10b981' : 
                             faucetStatus === 'error' ? '#ef4444' : '#f59e0b',
                  borderRadius: '20px',
                  padding: '30px',
                  maxWidth: '400px',
                  width: '90%',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                  animation: 'fadeInScale 0.3s ease-out',
                  position: 'relative'
                }}>
                  {/* Close button for error state */}
                  {faucetStatus === 'error' && (
                    <button
                      onClick={() => setFaucetStatus('idle')}
                      style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}

                  {/* Icon */}
                  <div style={{
                    fontSize: '60px',
                    marginBottom: '20px',
                    color: faucetStatus === 'success' ? '#10b981' : 
                           faucetStatus === 'error' ? '#ef4444' : '#f59e0b'
                  }}>
                    {faucetStatus === 'checking' && <FontAwesomeIcon icon={faSpinner} spin />}
                    {faucetStatus === 'claiming' && <FontAwesomeIcon icon={faGift} />}
                    {faucetStatus === 'success' && <FontAwesomeIcon icon={faCheckCircle} />}
                    {faucetStatus === 'error' && <FontAwesomeIcon icon={faExclamationTriangle} />}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    color: faucetStatus === 'success' ? '#10b981' : 
                           faucetStatus === 'error' ? '#ef4444' : '#f59e0b'
                  }}>
                    {faucetStatus === 'checking' && 'Checking Wallet Balance'}
                    {faucetStatus === 'claiming' && 'Claiming Free ETH!'}
                    {faucetStatus === 'success' && 'Success!'}
                    {faucetStatus === 'error' && 'Oops!'}
                  </h3>

                  {/* Message */}
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.5',
                    marginBottom: '20px',
                    color: '#d1d5db'
                  }}>
                    {faucetStatus === 'checking' && 'Verifying your wallet balance...'}
                    {faucetStatus === 'claiming' && 'Sending $0.05 ETH to your wallet...'}
                    {faucetStatus === 'success' && 'Successfully claimed $0.05 ETH !\n\n Now you can mint your NFT.'}
                    {faucetStatus === 'error' && faucetError}
                  </p>

                  {/* Progress bar for claiming */}
                  {faucetStatus === 'claiming' && (
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f59e0b',
                        borderRadius: '3px',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}></div>
                    </div>
                  )}

                  {/* Action button for success */}
                  {faucetStatus === 'success' && (
                    <button
                      onClick={() => setFaucetStatus('idle')}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <FontAwesomeIcon icon={faCoins} />
                      Continue to Mint NFT
                    </button>
                  )}

                  {/* ETH amount display */}
                 </div>
              </div>
            )}

            {/* Mint NFT Section - Embedded in Game Over */}
            
            {/* Modern Score Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Score Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '24px 32px',
                textAlign: 'center',
                color: 'white',
                minWidth: '200px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: 0.8,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Final Score
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  lineHeight: '1',
                  marginBottom: '8px'
                }}>
                  {animatedScore.toLocaleString()}
                </div>
                {score > previousBestScore && previousBestScore > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#4ade80',
                    fontWeight: '600',
                    background: 'rgba(74, 222, 128, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(74, 222, 128, 0.2)'
                  }}>
                    🔥 +{Math.round(((score - previousBestScore) / previousBestScore) * 100)}% Personal Best
                  </div>
                )}
                <div style={{
                  fontSize: '14px',
                  opacity: 0.7,
                  marginTop: '8px'
                }}>
                  Level {level}
                </div>
              </div>
              
              {/* Share Button */}
              <button 
                onClick={async () => {
                  try {
                    const improvementText = score > previousBestScore && previousBestScore > 0 
                      ? `\n\n🔥 That's +${Math.round(((score - previousBestScore) / previousBestScore) * 100)}% improvement from my Highest Score!`
                      : '';
                    
                    const shareText = `🍭 Pulled a ${score} in ChainCrush, now sitting pretty at level ${level} 💥
Come for my spot or stay mid 😏🏆${improvementText}`;
                    
                    const playerData = getPlayerData(context);
                    const shareUrl = `${APP_URL}`;
                    
                    if (actions && actions.composeCast) {
                      await actions.composeCast({
                        text: shareText,
                        embeds: [shareUrl],
                      });
                    } 
                  } catch (error) {
                    console.error('Error sharing score:', error);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #664eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none">
                  <rect width="256" height="256" rx="56" fill="#7C65C1"></rect>
                  <path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path>
                </svg>
                Share Achievement
              </button>
            </div>

            {address && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                padding: '20px',
                width: '90%',
                maxWidth: '400px',
                margin: '0 auto',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                pointerEvents: 'auto'
              }}>
               

                {/* Supply and Daily Limit Info - Only show if daily limit not reached */}
                {canMintToday !== false && (
                <div style={{ 
                  // background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.15) 0%, rgba(138, 43, 226, 0.15) 100%)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  // marginBottom: '20px',
                  fontSize: '16px',
                  // border: '1px solid rgba(255, 105, 180, 0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      padding: '8px', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>📊</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>Supply</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {totalSupply ? Number(totalSupply).toLocaleString() : '...'} / 10,000
                      </div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      padding: '8px', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>🎯</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>Remaining</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {contractRemainingSupply ? Number(contractRemainingSupply).toLocaleString() : '...'} NFTs
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '12px', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    display: 'flex',
                    flexDirection:"column",
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>⏰</span>
                    <span style={{ fontWeight: 'bold' }}>
                      Daily Limit: {remainingMintsToday !== undefined ? Number(remainingMintsToday) : '...'} / 5 remaining
                    </span>
                    {timeUntilReset && (
                    <div >
                      <div>{canMintToday === false ? 'Next reset in:' : 'Daily reset in:'}</div>
                    <div style={{ 
                        fontSize: '16px', 
                        fontFamily: 'monospace',
                        marginTop: '4px',
                        textShadow: canMintToday === false 
                          ? '0 0 10px rgba(99, 102, 241, 0.5)'
                          : '0 0 10px rgba(34, 197, 94, 0.5)'
                      }}>
                        {timeUntilReset}
                      </div>
                    </div>
                  )}
                </div>
                
                    {/* Countdown Timer - Always Show */}
                  
                  </div>
                )}
                
                {/* Daily Limit Reached - Show countdown timer */}
                {canMintToday === false && 
                  
                  
                    timeUntilReset && (
                  <div style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        fontSize: '15px',
                    display: 'flex', 
                        flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                        gap: '8px'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#ffff00' }}>
                          Can mint next nft in:
                        </span>
                    <div style={{ 
                          fontSize: '18px', 
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          textShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                        }}>
                          {timeUntilReset}
                        </div>
                      </div>
                    )
                }
                
                {/* Mint Status Popup */}
                {showMintPopup && mintStatus !== 'idle' && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.6)',
                      border:"10px",
                      padding:"20px 30px",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3000,
                    }}
                    onClick={() => setShowMintPopup(false)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'relative',
                        width: 'min(92vw, 420px)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(14px)',
                        background:
                          mintStatus === 'minting'
                            ? 'linear-gradient(135deg, rgba(253, 224, 71, 0.15), rgba(250, 204, 21, 0.08))'
                            : mintStatus === 'success'
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.08))'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.08))',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
                      }}
                    >
                      {/* Close (X) */}
                      <button
                        onClick={() => setShowMintPopup(false)}
                        aria-label="Close"
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: 8,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>

                      {/* Content */}
                      {mintStatus === 'minting' && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            style={{
                              marginRight: 12,
                              fontSize: 20,
                      animation: 'spin 1s linear infinite'
                            }}
                          >
                            ⏳
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: 18 }}>Minting Your NFT...</div>
                            <div style={{ fontSize: 13, opacity: 0.8 }}>Please wait while we confirm the transaction.</div>
                          </div>
                  </div>
                )}
                
                {mintStatus === 'success' && (
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 18, color: '#4ade80', marginBottom: 12 }}>NFT Minted Successfully!</div>
                          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>Your ChainCrush NFT has been added to your wallet.</div>
                          
                          {/* Share Button */}
                          <button
                            onClick={handleShareNFT}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: '#fff',
                              border: 'none',
                    borderRadius: '12px',
                              padding: '12px 20px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            🚀 Share Your Achievement
                          </button>
                  </div>
                )}
                
                {mintStatus === 'error' && (
                        <div>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>❌</div>
                          <div style={{ fontWeight: 'bold', fontSize: 18 }}>Minting Failed</div>
                          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>Something went wrong</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Best Score */}
            {/* <div style={{
              fontSize: '13px',
              color: '#ffff00',
              fontWeight: 'bold',
              border: '1px solid #ffff00',
              padding: '8px 16px',
              borderRadius: '8px',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Best
              <p style={{ fontSize: '29px', fontWeight: 'bold', color: '#ffff00' }}>{Math.max(score, previousBestScore)}</p>
            </div> */}
            
           
          </div>
          
          {/* Mint Button - Bottom Center (replaces Play Again) */}
          {mintStatus !== 'success' && address && canMintToday !== false && contractRemainingSupply !== BigInt(0) && (
            <button
              onClick={handleMintNFT}
              style={{ 
                position: 'fixed', 
                bottom: '40px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 2000,
                padding: '12px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #ff69b4, #ff1493)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.5s ease',
                pointerEvents: 'auto',
                cursor: mintStatus === 'minting' ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }}
            >
              {mintStatus === 'minting' ? '⏳ Minting...' : '🎴 Mint NFT'}
            </button>
          )}

          {/* Play Again Button - Show after successful mint OR when daily limit reached OR no wallet */}
          {(mintStatus === 'success' || !address || (address && (canMintToday === false || contractRemainingSupply === BigInt(0)))) && (
            <button
              style={{ 
                position: 'fixed', 
                bottom: '40px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 2000,
                padding: '10px 20px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: 'lightgreen',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.5s ease',
                pointerEvents: 'auto'
              }}
              // onMouseEnter={(e) => {
              //   e.currentTarget.style.backgroundColor = '#1589cc';
              //   e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              // }}
              // onMouseLeave={(e) => {
              //   e.currentTarget.style.backgroundColor = '#19adff';
              //   e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              // }}
              onClick={handleRestart}
            >
              ▶ Play Again 
            </button>
          )}
        </>
      )}
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-10px) rotate(180deg);
            opacity: 0.6;
          }
        }
        
        .float-element {
          animation: float 6s ease-in-out infinite;
        }
        
        .bg-paused .float-element {
          animation-play-state: paused !important;
        }
        
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      { gameInitialized && !gameOver && (
        <div style={{ position: 'absolute', top: 10, left: 16, zIndex: 2001 }}>
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              // border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              padding: '6px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => setShowConfirmEnd(true)}
          >
            ← Home
          </button>
        </div>
      )}
      <ConfirmEndGameModal
        open={showConfirmEnd}
        onClose={() => setShowConfirmEnd(false)}
        onConfirm={() => {
          setShowConfirmEnd(false);
          setGameOver(true);
          setGameOverState(true); // show stats overlay if needed
        }}
        message="Are you sure you want to end this game? Your progress will be lost."
      />
      
      {/* No Moves Left Popup */}
      {showNoMovesPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤔</div>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              No Moves Detected!
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '16px', 
              lineHeight: '1.5', 
              marginBottom: '25px' 
            }}>
              It looks like there might not be any valid moves left on the board. What would you like to do?
            </p>
            
            <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              <button
                onClick={handleContinueSearching}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  padding: '15px 25px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                🔍 Keep Looking for Moves
              </button>
              
              <button
                onClick={handleEndGameFromNoMoves}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  border: 'none',
                  color: '#fff',
                  padding: '15px 25px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(238, 90, 82, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(238, 90, 82, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(238, 90, 82, 0.4)';
                }}
              >
                🏁 End Game Now
              </button>
            </div>
            
            <p style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '12px', 
              marginTop: '15px',
              fontStyle: 'italic'
            }}>
              You have {moves} moves remaining
            </p>
          </div>
        </div>
      )}
      {/* Modern Reshuffle Button */}
      {gameInitialized && !gameOver && reshuffles > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: 0, width: '100vw', display: 'flex', justifyContent: 'center', zIndex: 2002 }}>
          <button
            onClick={() => {
              if (reshuffleGridRef.current) {
                reshuffleGridRef.current();
                setReshuffles(r => r - 1);
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '16px',
              padding: '12px 20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }}
          >
            🔄 Reshuffle ({reshuffles})
          </button>
        </div>
      )}
      
      {/* Thunder Combo Animation */}
      {showComboAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 3000,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Thunder Flash Effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3))',
            animation: 'thunderFlash 0.3s ease-out forwards'
          }} />
          
          {/* Thunder Lightning Effect */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4px',
            height: '60%',
            background: 'linear-gradient(to bottom, #ffff00, #ff6b6b, #ffff00)',
            boxShadow: '0 0 20px #ffff00, 0 0 40px #ff6b6b',
            animation: 'thunderLightning 0.5s ease-out forwards'
          }} />
          
          {/* Combo Text */}
          <div style={{
            fontSize: '96px',
            fontWeight: 'bold',
            color: '#ff6b6b',
            textShadow: '0 0 30px rgba(255, 107, 107, 0.9), 0 0 60px rgba(255, 107, 107, 0.6)',
            animation: 'comboThunder 2s ease-out forwards',
            textAlign: 'center',
            zIndex: 1,
            position: 'relative'
          }}>
            {comboCount}x COMBO!
          </div>
          
          {/* Thunder Sound Effect (Visual) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
            animation: 'thunderRipple 0.8s ease-out forwards'
          }} />
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes thunderFlash {
            0% {
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            30% {
              opacity: 0.8;
            }
            100% {
              opacity: 0;
            }
          }
          
          @keyframes thunderLightning {
            0% {
              opacity: 0;
              transform: translateX(-50%) scaleY(0);
            }
            20% {
              opacity: 1;
              transform: translateX(-50%) scaleY(1);
            }
            40% {
              opacity: 0.8;
              transform: translateX(-50%) scaleY(1.2);
            }
            60% {
              opacity: 0.6;
              transform: translateX(-50%) scaleY(0.8);
            }
            100% {
              opacity: 0;
              transform: translateX(-50%) scaleY(0);
            }
          }
          
          @keyframes comboThunder {
            0% {
              opacity: 0;
              transform: scale(0.5) rotate(-5deg);
            }
            20% {
              opacity: 1;
              transform: scale(1.3) rotate(2deg);
            }
            40% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            60% {
              opacity: 1;
              transform: scale(1.1) rotate(-1deg);
            }
            80% {
              opacity: 0.8;
              transform: scale(1.05) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: scale(1.2) rotate(0deg);
            }
          }
          
          @keyframes thunderRipple {
            0% {
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(0);
            }
            50% {
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(2);
            }
          }
        `
      }} />
    </div>
  );
} 