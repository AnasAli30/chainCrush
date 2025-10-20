'use client'

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Phaser from 'phaser';
import { APP_URL } from '@/lib/constants';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getPlayerData } from '@/lib/leaderboard';
import { incrementGamesPlayed, addGameScore } from '@/lib/game-counter';
import { useContractWrite, useContractRead, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI, TOKEN_REWARD_ABI } from '@/lib/contracts';
import { authenticatedFetch } from '@/lib/auth';
import ConfirmEndGameModal from '../ConfirmEndGameModal';
import GiftBox from '../GiftBox';
import Shop from '../Shop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCoins, 
  faCheckCircle, 
  faExclamationTriangle, 
  faSpinner,
  faTimes,
  faGift,
  faShuffle,
  faBurst,
  faFire,
  faTrophy,
  faBolt,
  faTimesCircle,
  faStore
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
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(10);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [previousBestScore, setPreviousBestScore] = useState(() => parseInt(localStorage.getItem('candyCrushMaxScore') || '0'));
  const [gameKey, setGameKey] = useState<number>(0);
  
  // Internal loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInternalLoader, setShowInternalLoader] = useState(true);
  
  // Blockchain transaction state for Play Again
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'confirmed' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Challenge system state
  const [challengeCandyType, setChallengeCandyType] = useState('1');
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeProgress, setChallengeProgress] = useState(0);

  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showNoMovesPopup, setShowNoMovesPopup] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showBoosterPopup, setShowBoosterPopup] = useState(false);
  const [boosterPopupShown, setBoosterPopupShown] = useState(false);
  const [boosterBusy, setBoosterBusy] = useState(false);

  // Add power-ups state
  const [reshuffles, setReshuffles] = useState(1);
  const reshuffleGridRef = useRef<null | (() => void)>(null);
  const [reshuffleError, setReshuffleError] = useState<string | null>(null);
  
  // Add party popper state
  const [partyPoppers, setPartyPoppers] = useState(1);
  const partyPopperRef = useRef<null | (() => void)>(null);
  const [partyPopperError, setPartyPopperError] = useState<string | null>(null);
  
  // Database booster states
  const [dbBoosters, setDbBoosters] = useState({ shuffle: 0, partyPopper: 0 });
  const [boosterLoading, setBoosterLoading] = useState(false);
  
  // Track when only purchased boosters remain (for permanent color change)
  const onlyPurchasedReshuffles = reshuffles === 0 && dbBoosters.shuffle > 0;
  const onlyPurchasedPartyPoppers = partyPoppers === 0 && dbBoosters.partyPopper > 0;
  
  // Calculate total available boosters (game + database)
  const totalReshuffles = reshuffles + dbBoosters.shuffle;
  const totalPartyPoppers = partyPoppers + dbBoosters.partyPopper;
  
  // Combo system state
  const [comboCount, setComboCount] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const isUserMoveRef = useRef(false); // Track if current match is from user move (not a combo)
  
  // Layered bar animation state
  const [showLayeredBarAnimation, setShowLayeredBarAnimation] = useState(false);
  const [layeredBarData, setLayeredBarData] = useState<{x: number, y: number, count: number} | null>(null);
  
  // Daily limit countdown state
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [remainingClaims, setRemainingClaims] = useState(5);

  // Game time tracking
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(0);

  // Check remaining gift box claims via API
  const checkRemainingClaims = async () => {
    if (!address) {
      setRemainingClaims(5); // Default to 5 if no wallet connected
      return 5;
    }
    
    try {
      const response = await fetch(`/api/claim-gift-box?userAddress=${address}&fid=${context?.user?.fid || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setRemainingClaims(data.remainingClaims);
        return data.remainingClaims;
      } else {
        console.error('Failed to check remaining claims:', data.error);
        setRemainingClaims(0);
        return 0;
      }
    } catch (error) {
      console.error('Failed to check remaining claims:', error);
      setRemainingClaims(5); // Default to 5 on error
      return 5;
    }
  };

  // Fetch user's purchased boosters from database
  const fetchUserBoosters = async () => {
    if (!context?.user?.fid) {
      setDbBoosters({ shuffle: 0, partyPopper: 0 });
      return;
    }

    setBoosterLoading(true);
    try {
      const response = await authenticatedFetch(`/api/purchase-booster?fid=${context.user.fid}`);
      const data = await response.json();
      
      if (data.success) {
        setDbBoosters(data.data.boosters);
        console.log('✅ Fetched user boosters:', data.data.boosters);
      } else {
        console.error('Failed to fetch boosters:', data.error);
        setDbBoosters({ shuffle: 0, partyPopper: 0 });
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
      setDbBoosters({ shuffle: 0, partyPopper: 0 });
    } finally {
      setBoosterLoading(false);
    }
  };

  // Update database when purchased boosters are used
  const updateDatabaseBoosters = async (boosterType: 'shuffle' | 'partyPopper', used: number) => {
    if (!context?.user?.fid) return;

    try {
      await authenticatedFetch('/api/purchase-booster', {
        method: 'PATCH',
        body: JSON.stringify({
          fid: context.user.fid,
          boosterType: boosterType === 'shuffle' ? 0 : 1,
          used: used
        }),
      });
      console.log(`✅ Updated database: used ${used} ${boosterType} booster(s)`);
    } catch (error) {
      console.error(`❌ Error updating ${boosterType} booster in database:`, error);
    }
  };

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

  // Check for no boosters left (show popup once per game)
  useEffect(() => {
    if (gameInitialized && !gameOver && !boosterPopupShown && totalReshuffles === 0 && totalPartyPoppers === 0) {
      setShowBoosterPopup(true);
      setBoosterPopupShown(true);
    }
  }, [totalReshuffles, totalPartyPoppers, gameInitialized, gameOver, boosterPopupShown]);

  // Reset booster popup for new game
  useEffect(() => {
    if (gameKey > 0) {
      setBoosterPopupShown(false);
    }
  }, [gameKey]);

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

  // Start new game with blockchain transaction
  const handleStartNewGame = async () => {
    if (!address) {
      // If no wallet, just restart normally
      handleRestart();
      return;
    }

    try {
      // Reset any previous error state
      setTransactionStatus('idle')
      setTransactionHash(null)
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'startGame',
        args: []
      })
    } catch (err) {
      console.error('Failed to start new game transaction:', err)
      setTransactionStatus('error')
      setShowTransactionPopup(true)
      
      // Log detailed error for debugging
      if (err instanceof Error) {
        console.error('Transaction error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        })
      }
    }
  }

  const handleRestart = () => {
    // Increment games played counter
    incrementGamesPlayed();
    
    // Reset mint status FIRST to immediately hide success popup
    setMintStatus('idle');
    setMintError('');
    setNftRecorded(false); // Reset NFT recording flag
    setShowMintPopup(false); // Hide any open mint popup
    
    // Force hide popup after a small delay to ensure it's gone
    setTimeout(() => {
      setShowMintPopup(false);
      setMintStatus('idle'); // Double-check status is reset
    }, 100);
    
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
    // Reset combo state
    setComboCount(0);
    setShowComboAnimation(false);
    isUserMoveRef.current = false; // Reset the user move flag
    
    // Reset layered bar animation state
    setShowLayeredBarAnimation(false);
    setLayeredBarData(null);
    setPreviousBestScore(parseInt(localStorage.getItem('candyCrushMaxScore') || '0'));
    setGameKey((k: number) => k + 1); // Increment gameKey to remount game container
    setShowNoMovesPopup(false); // Reset no moves popup
    
    // Reset power-ups count
    setReshuffles(1);
    setReshuffleError(null);
    setPartyPoppers(1);
    setPartyPopperError(null);
    
    // Fetch user's purchased boosters from database
    fetchUserBoosters();
    
    // Refresh mint eligibility data
    // if (address) {
    //   checkFaucetEligibility();
    // }
    
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
    
    // Add score to the scores array for average calculation
    addGameScore(score);
    
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
      
      // Initialize game - loader will be hidden by Phaser's loading system
        initGame();
      
      // Start tracking game time
      setGameStartTime(Date.now());
      setGameDuration(0);
      // Reset mint status for new game
      setMintStatus('idle');
      setMintError('');
      setNftRecorded(false); // Reset NFT recording flag
      
      // Refresh mint eligibility data for new game
      // if (address) {
      //   checkFaucetEligibility();
      // }
      
      // Fetch user's purchased boosters from database
      fetchUserBoosters();
      
      // Game initialization is handled directly
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

    // Sound and particle effect variables
    let sounds: { 
      match: Phaser.Sound.BaseSound; 
      combo: Phaser.Sound.BaseSound;
      levelUp: Phaser.Sound.BaseSound;
      invalidMove: Phaser.Sound.BaseSound;
      candyCrush: Phaser.Sound.BaseSound;
      amazing: Phaser.Sound.BaseSound;
    };
    let particleEmitters: { [key: string]: any } = {};
    let sparkleEmitter: any;

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
      // Set up loading progress tracking
      this.load.on('progress', (value: number) => {
        // Convert Phaser's 0-1 progress to percentage (0-100)
        const progressPercent = Math.floor(value * 100);
        console.log(`📊 Loading progress: ${progressPercent}%`);
        
        // Update React state with the actual loading progress
        setLoadingProgress(progressPercent);
      });
      // Load all the meme images from candy folder
      CANDY_TYPES.forEach(type => {
        this.load.image('candy-' + type, `/candy/${type}.png`);
      });
      
      // Load sound effects for candy matches and game events
      // Load all sound effects with error handling
      try {
        this.load.audio('match-sound', ['/sounds/candy-match.mp3']);
        this.load.audio('combo-sound', ['/sounds/combo.mp3']);
        this.load.audio('level-up', ['/sounds/level-up.mp3']);
        this.load.audio('invalid-move', ['/sounds/invalid-move.mp3']);
        this.load.audio('candy-crush', ['/sounds/candy-crush.mp3']);
        this.load.audio('amazing', ['/sounds/Amazing.mp3']);
        
        // Add load complete listener to verify sounds loaded and hide loader
        this.load.on('complete', () => {
          console.log('✅ All game assets loaded successfully');
          
          // Check if level-up sound loaded
          if (this.cache.audio.exists('level-up')) {
            console.log('✅ Level-up sound loaded successfully');
          } else {
            console.error('❌ Level-up sound failed to load!');
          }
          
          // Check if amazing sound loaded
          if (this.cache.audio.exists('amazing')) {
            console.log('✅ Amazing sound loaded successfully');
          } else {
            console.error('❌ Amazing sound failed to load!');
          }
          
          // Give a small delay before hiding the loader to ensure everything is ready
          setTimeout(() => {
            setLoadingProgress(100);
            setShowInternalLoader(false);
          }, 500);
        });
      } catch (error) {
        console.error('❌ Error loading sound assets:', error);
      }
      
      // Load particle textures for special effects
      this.load.image('particle', '/images/particle.png');
      this.load.image('star', '/images/star.png');
      this.load.image('sparkle', '/images/sparkle.png');
      
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
        console.error('❌ Failed to load asset:', file.key);
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
      
      // Initialize sound effects with more controlled volume
      // The individual volume here gets multiplied by the master volume
      sounds = {
        match: this.sound.add('match-sound', { volume: 0.3, loop: false }),
        combo: this.sound.add('combo-sound', { volume: 0.35, loop: false }),
        levelUp: this.sound.add('level-up', { volume: 0.4, loop: false }),
        invalidMove: this.sound.add('invalid-move', { volume: 0.25, loop: false }),
        candyCrush: this.sound.add('candy-crush', { volume: 0.35, loop: false }),
        amazing: this.sound.add('amazing', { volume: 0.4, loop: false })
      };
      
      // Configure the sound system
      this.sound.setVolume(0.5); // Additional global volume control
      
      // Set up sound handlers to avoid issues
      Object.values(sounds).forEach(sound => {
        sound.on('complete', () => {
          // Ensure sound stops completely when done playing
          if (sound.isPlaying) sound.stop();
        });
      });
      
      // Create particle emitters for each candy type
      CANDY_TYPES.forEach((type) => {
        // Use Phaser's ParticleEmitterManager directly
        const emitterConfig = {
          x: 0,
          y: 0,
          blendMode: Phaser.BlendModes.ADD,
          lifespan: 600,
          speed: { min: 100, max: 200 },
          scale: { start: 0.6, end: 0 },
          rotate: { min: 0, max: 360 },
          alpha: { start: 1, end: 0 },
          frequency: -1, // Don't emit automatically
          tint: getMemeColor(type) // Set color directly in config
        };
        
        // Create a separate particle manager for each candy type
        const particleManager = this.add.particles(0, 0, 'particle', emitterConfig);
        // Store the particle manager as our emitter (Phaser API differences)
        particleEmitters[type] = particleManager;
      });
      
      // Create sparkle particle effect for score animations
      const sparkleConfig = {
        x: 0,
        y: 0,
        blendMode: Phaser.BlendModes.ADD,
        lifespan: 800,
        speed: { min: 50, max: 100 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        frequency: -1 // Don't emit automatically
      };
      
      // Create sparkle particle manager
      const sparkleManager = this.add.particles(0, 0, 'sparkle', sparkleConfig);
      // Store the manager as our emitter (Phaser API differences)
      sparkleEmitter = sparkleManager;
      
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
      
      scoreText = this.add.text(centerX -80, 10, 'Score:0', { fontSize: '20px', color: 'white', fontStyle: 'bold' });
      movesText = this.add.text(screenWidth - 70, 40, 'Moves:10', { fontSize: '16px', color: 'white', fontStyle: 'bold' }).setOrigin(1, 0);
      
      // Level text above progress bar
      
      
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
        challengeText = this.add.text(centerX + 10, 100, '(0/10)', { fontSize: '17px', color: 'white', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
        levelText = this.add.text(centerX, 60, 'Level: 1', { fontSize: '20px', color: 'white', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
      // Initialize UI
      updateUI();

      // In initGame, after defining scene, add:
      scene.events.on('levelup', () => {
        setReshuffles(r => r + 1);
        setPartyPoppers(p => p + 1);
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
          challengeText.setColor('#ffffff'); // White otherwise
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
        
        // Play level up sound - simplified approach
        console.log('🔊 Playing level up sound...');
        
        // Stop any currently playing sounds first
        Object.values(sounds).forEach(sound => {
          if (sound.isPlaying) sound.stop();
        });
        
        // Use HTML Audio API for reliable playback
        try {
          const audio = new Audio('/sounds/level-up.mp3');
          audio.volume = 0.6;
          audio.play().then(() => {
            console.log('✅ Level up sound played successfully');
          }).catch(error => {
            console.error('❌ Level up sound failed:', error);
            
            // Fallback to Phaser sound
            try {
              if (sounds && sounds.levelUp) {
                sounds.levelUp.play({ volume: 0.6 });
                console.log('✅ Level up sound played with Phaser fallback');
              }
            } catch (phaserError) {
              console.error('❌ Phaser fallback also failed:', phaserError);
            }
          });
        } catch (error) {
          console.error('❌ Audio creation failed:', error);
        }
        
        // Increment level and generate new challenge
        gameLevel++;
        scene.events.emit('levelup'); // <-- emit event for reshuffle
        
        // Create a DOM-based level up animation that looks much better than Phaser text
        // First create a container div for our CSS animation
        const gameContainer = document.getElementById('game-container') || gameRef.current;
        const levelUpElement = document.createElement('div');
        levelUpElement.className = 'level-up-animation';
        levelUpElement.innerHTML = `
          <div class="level-up-text">LEVEL UP!</div>
          <div class="level-number">${gameLevel}</div>
          <div class="particles-container">
            ${Array(20).fill(0).map(() => '<div class="particle"></div>').join('')}
          </div>
        `;
        
        // Inject the required CSS
        if (!document.getElementById('level-up-styles')) {
          const styleElement = document.createElement('style');
          styleElement.id = 'level-up-styles';
          styleElement.textContent = `
            .level-up-animation {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              pointer-events: none;
              z-index: 1000;
            }
            .level-up-text {
              font-size: 52px;
              font-weight: bold;
              color: #FFFF00;
              text-shadow: 
                0 0 10px #FF00FF,
                0 0 20px #FF00FF,
                2px 2px 2px rgba(0,0,0,0.8);
              animation: pulse 0.8s ease-in-out infinite alternate, 
                         levelup 2s ease-out forwards;
              opacity: 0;
            }
            .level-number {
              font-size: 80px;
              font-weight: bold;
              color: #FFFFFF;
              text-shadow: 
                0 0 10px #00FFFF,
                0 0 20px #0088FF,
                2px 2px 2px rgba(0,0,0,0.8);
              animation: appear 0.5s 0.3s ease-out forwards;
              opacity: 0;
              margin-top: 10px;
            }
            .particles-container {
              position: absolute;
              width: 100%;
              height: 100%;
            }
            .particle {
              position: absolute;
              width: 10px;
              height: 10px;
              background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,0,0.8) 70%, rgba(255,255,0,0) 100%);
              border-radius: 50%;
              opacity: 0;
              animation: particle-animation 2s ease-out forwards;
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              100% { transform: scale(1.1); }
            }
            @keyframes levelup {
              0% { transform: translateY(50px); opacity: 0; }
              10% { transform: translateY(0); opacity: 1; }
              80% { transform: translateY(0); opacity: 1; }
              100% { transform: translateY(-100px); opacity: 0; }
            }
            @keyframes appear {
              0% { transform: scale(0.5); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes float {
              0% { transform: translateY(0); }
              100% { transform: translateY(-15px); }
            }
            @keyframes particle-animation {
              0% { 
                transform: translate(0, 0) scale(0); 
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 0.5;
              }
              100% { 
                transform: translate(
                  calc(${Math.random() < 0.5 ? '-' : ''}1 * ${Math.floor(Math.random() * 200)}px), 
                  calc(${Math.random() < 0.5 ? '-' : ''}1 * ${Math.floor(Math.random() * 200)}px)
                ) scale(${0.5 + Math.random()});
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(styleElement);
        }
        
        // Position the particles randomly
        const particles = levelUpElement.querySelectorAll('.particle');
        particles.forEach((p) => {
          // Cast to HTMLElement to safely access style properties
          const particle = p as HTMLElement;
          // Random start position around the center
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          particle.style.left = `${centerX}px`;
          particle.style.top = `${centerY}px`;
          
          // Random animation delay
          particle.style.animationDelay = `${Math.random() * 0.5}s`;
        });
        
        // Add to the DOM
        if (gameContainer) {
          gameContainer.appendChild(levelUpElement);
          
          // Remove after animation completes
          setTimeout(() => {
            if (levelUpElement.parentNode) {
              levelUpElement.parentNode.removeChild(levelUpElement);
            }
          }, 2500);
        }
        
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
      // Enhanced vibration function with proper error handling for iOS and other devices
      try {
        // Check if vibration is supported and available
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          // For iOS devices, ensure we're in a user interaction context
          const result = navigator.vibrate(pattern);
          
          // Some browsers return false when vibration is not supported
          if (result === false) {
            console.log('Vibration not supported on this device');
            return false;
          }
          
          return true;
        } else {
          console.log('Vibration API not available');
          return false;
        }
      } catch (error) {
        console.log('Vibration failed:', error);
        return false;
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
        
        // Play invalid move sound
        if (sounds && sounds.invalidMove) {
          sounds.invalidMove.play();
        }
        
        // Show invalid move effect
        showInvalidMoveEffect();
        
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
          
          // Reset combo counter for new move - this is the start of a potential combo chain
          // In Candy Crush, the first match doesn't count as a combo, so we start at 0
          console.log('🔄 New user move - resetting combo counter to 0');
          setComboCount(0);
          
          // Mark this as a user move - initial match should NOT count as combo
          isUserMoveRef.current = true;
          console.log('⚠️ Setting isUserMoveRef = true (user initiated match)');
          
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
      
      // Play invalid move sound - first stop any playing sounds
      Object.values(sounds).forEach(sound => {
        if (sound.isPlaying) sound.stop();
      });
      
      if (sounds && sounds.invalidMove) {
        sounds.invalidMove.play({
          volume: 0.25,
          detune: 0
        });
      }
      
      // Vibrate for invalid move
      triggerVibration([50, 50]); // Double short vibration for invalid swap
      
      
      
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
        if (comboCount > 0) {
          console.log('🔄 Combo chain broken - resetting combo counter');
        setComboCount(0);
        }
        
        updateUI(); // Update status
        
        if (gameMoves <= 0) {
          // Store previous best score before updating
          const currentBest = parseInt(localStorage.getItem('candyBestScore') || '0');
          setPreviousBestScore(currentBest);
          
          // Update best score if current score is better
          if (gameScore > currentBest) {
            localStorage.setItem('candyBestScore', gameScore.toString());
          }
          
          // Add score to the scores array for average calculation
          addGameScore(gameScore);
          
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
      
      // We don't increment combo count here anymore
      // Combo count is handled in the cascade completion
      
      // Calculate score based on combo status
      // In original Candy Crush:
      // - User's initial match: base score with no multiplier (comboCount = 0)
      // - First automatic cascade match: 2x multiplier (comboCount = 1)
      // - Second automatic cascade match: 3x multiplier (comboCount = 2)
      // And so on...
      const baseScore = matches.length * 100;
      
      // Only apply multiplier for automatic matches (when combo counter > 0)
      // First automatic match gets 2x, second gets 3x, etc.
      const comboMultiplier = comboCount > 0 ? comboCount + 1 : 1;
      
      // Apply appropriate cap (original game caps around 6x)
      const cappedMultiplier = Math.min(comboMultiplier, 6);
      
      // Calculate total score using the multiplier
      const totalScore = baseScore * cappedMultiplier;
      
      // Log the score calculation
      if (comboCount > 0) {
        console.log(`💰 Combo ${comboCount} multiplier: ${baseScore} × ${cappedMultiplier}x = ${totalScore}`);
      } else {
        console.log(`💰 Regular match score: ${baseScore} (no combo multiplier)`);
      }
      
      gameScore += totalScore;
      updateUI();
      
      console.log(`💥 Removing ${matches.length} matches (Combo: ${comboMultiplier}x, Score: +${totalScore})`);
      
      // Play sound effects based on match size and combo
      // First stop any currently playing sounds to avoid overlap
      Object.values(sounds).forEach(sound => {
        if (sound.isPlaying) sound.stop();
      });
      
      // Play appropriate sound based on whether this is a user match or a combo
      // In the real Candy Crush, only automatic matches from cascades play the combo sound
      // IMPORTANT: We need to check if this is an automatic match (combo) or user's initial match
      const isAutoMatch = comboCount > 0;
      if (isAutoMatch) {
        // This is an automatic match from a cascade (an actual combo!)
        try {
          // Recreate the sound to ensure it plays correctly each time
          const comboSound = scene.sound.add('combo-sound', { 
            volume: 0.45 * Math.min(comboCount / 2 + 0.7, 1.3), // Louder with higher combos
            loop: false 
          });
          
          // The original game increases pitch with higher combos
          comboSound.play({
            detune: comboCount * 80 // Higher pitch for bigger combos
          });
          
          // Clean up sound when done
          comboSound.once('complete', () => {
            comboSound.destroy();
          });
          
          console.log(`🔊 Playing combo sound for combo #${comboCount}`);
        } catch (error) {
          console.error('Failed to play combo sound:', error);
          
          // Fallback to the original sound object
          sounds.combo.play({
            volume: 0.4,
            detune: comboCount * 80
          });
        }
      } else {
        // Regular match made by user (not a combo)
        sounds.match.play({
          volume: 0.3 + (0.05 * Math.min(matches.length, 5)), // Slight volume increase for bigger matches
          detune: matches.length * 30 // Higher pitch for bigger matches
        });
        console.log('🔊 Playing regular match sound (no combo)');
      }
      
      // Show combo animation based on combo count
      // In Candy Crush, only automatic matches from cascades trigger combo animations
      // Re-use the isAutoMatch flag to ensure consistency
      if (isAutoMatch) {  // Only show for actual combos (not user's initial match)
        console.log(`🎯 Showing combo animation for combo count: ${comboCount}`);
        
        // Higher combos deserve more emphasis - just like in the original game
        if (comboCount >= 3) {
          // For big combos, we want to delay slightly to let the match animation be seen first
          setTimeout(() => {
            setShowComboAnimation(true);
            // Vibrate differently for bigger combos - original game has stronger feedback
            triggerVibration([100, 50, 200]);
          }, 150); // Slightly faster to match original game pace
        } else {
          // For smaller combos, show immediately but with shorter duration
          setTimeout(() => {
            setShowComboAnimation(true);
            // Light vibration for basic combos
            triggerVibration([80]);
          }, 50);
        }
        
        // Clear combo animation after the appropriate duration
        // Longer duration for bigger combos like in the original game
        setTimeout(() => setShowComboAnimation(false), 
          comboCount >= 4 ? 2400 : // Highest combos (like original game)
          comboCount >= 2 ? 2000 : // Medium combos
          1600);                   // First combo (automatically matched)
      }
      
      // Special layered bar animation for 5+ candy matches (like original Candy Crush)
      if (matches.length >= 5) {
        console.log(`🌟 Creating layered bar animation for ${matches.length} candy match!`);
        
        // Play amazing sound for 5+ candy matches
        try {
          if (sounds && sounds.amazing) {
            sounds.amazing.play();
            console.log('🎵 Playing amazing sound for 5+ candy match!');
          }
        } catch (error) {
          console.error('❌ Error playing amazing sound:', error);
        }
        
        // Calculate the center position of all matched candies
        let centerX = 0;
        let centerY = 0;
        matches.forEach(candy => {
          centerX += candy.x;
          centerY += candy.y;
        });
        centerX /= matches.length;
        centerY /= matches.length;
        
        // Convert Phaser coordinates to screen coordinates properly
        // Phaser uses game canvas coordinates, we need to convert to viewport coordinates
        const canvas = gameRef.current?.querySelector('canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          centerX = rect.left + (centerX / canvas.width) * rect.width;
          centerY = rect.top + (centerY / canvas.height) * rect.height;
        }
        
        // Set the animation data and trigger it
        setLayeredBarData({
          x: centerX,
          y: centerY,
          count: matches.length
        });
        setShowLayeredBarAnimation(true);
        
        // Auto-hide after animation duration
        setTimeout(() => {
          setShowLayeredBarAnimation(false);
          setLayeredBarData(null);
        }, 3000);
      }
      
      // Vibrate based on match size and combo - bigger matches and combos = longer vibration
      // Original Candy Crush has more pronounced feedback for bigger combos
      const vibrationIntensity = Math.min(matches.length * 25 + (comboCount * 35), 400);
      
      // Only trigger this global vibration for non-combo matches
      // For combos we already have specific vibration patterns above
      if (comboCount === 0) {
        triggerVibration([vibrationIntensity]);
      }
      
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
      
      // Create score text to animate to score counter
      const scorePosition = { 
        x: matches.reduce((sum, c) => sum + c.x, 0) / matches.length,
        y: matches.reduce((sum, c) => sum + c.y, 0) / matches.length
      };
      
      // Get center position for reference
      const centerX = scene.cameras.main.width / 2;
      
      // Create a more direct animation to the score that clearly moves to the score counter
      
      // First create the flying score element
      const gameContainer = document.getElementById('game-container') || gameRef.current;
      if (!gameContainer) return;
      
      // Get position of match in screen coordinates
      const scoreX = scorePosition.x;
      const scoreY = scorePosition.y;
      
      // Get exact target coordinates for score display
      const actualScoreX = scoreText ? scoreText.x + scoreText.width/2 : 60;
      const actualScoreY = scoreText ? scoreText.y + scoreText.height/2 : 10;
      
      // Calculate animation parameters based on actual positions
      const distanceX = actualScoreX - scoreX;
      const distanceY = actualScoreY - scoreY;
      
      // Create the score element
      const scoreElement = document.createElement('div');
      scoreElement.className = 'flying-score';
      scoreElement.textContent = `+${totalScore}`;
      scoreElement.id = `score-popup-${Date.now()}`; // Unique ID for this specific animation
      
      // Calculate the angle for animation
      const angle = Math.atan2(distanceY, distanceX) * (180 / Math.PI);
      
      // Create a container for our particles
      const particleContainer = document.createElement('div');
      particleContainer.className = 'score-particles-container';
      particleContainer.id = `score-particles-${Date.now()}`;
      gameContainer.appendChild(particleContainer);
      
      // Create particles that will fly to score
      const particleCount = 5;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'score-particle';
        particle.textContent = '+';
        particleContainer.appendChild(particle);
      }
      
      // Inject the required CSS with dynamic keyframes for this specific animation
      // This recreates the classic Candy Crush animation flow
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .flying-score {
          position: absolute;
          font-size: 28px;
          font-weight: bold;
          color: #FFFF00;
          text-shadow: 
            0 0 5px #FF00FF,
            0 0 10px #FF8800,
            2px 2px 2px rgba(0,0,0,0.8);
          z-index: 1000;
          pointer-events: none;
          transform: translate(-50%, -50%);
        }
        
        #${scoreElement.id} {
          animation: popAndDisappear${Date.now()} 0.7s forwards;
        }
        
        .score-particles-container {
          position: absolute;
          left: ${scoreX}px;
          top: ${scoreY}px;
          width: 0;
          height: 0;
          z-index: 999;
        }
        
        .score-particle {
          position: absolute;
          font-size: 22px;
          font-weight: bold;
          color: #FFFF00;
          text-shadow: 0 0 4px #FF8800, 2px 2px 2px rgba(0,0,0,0.7);
          opacity: 0;
          transform: translate(-50%, -50%);
        }
        
        #${particleContainer.id} .score-particle:nth-child(1) {
          animation: particleFly${Date.now()}-1 0.8s 0.5s forwards cubic-bezier(.17,.67,.4,.99);
        }
        #${particleContainer.id} .score-particle:nth-child(2) {
          animation: particleFly${Date.now()}-2 0.75s 0.5s forwards cubic-bezier(.17,.67,.4,.99);
        }
        #${particleContainer.id} .score-particle:nth-child(3) {
          animation: particleFly${Date.now()}-3 0.7s 0.5s forwards cubic-bezier(.17,.67,.4,.99);
        }
        #${particleContainer.id} .score-particle:nth-child(4) {
          animation: particleFly${Date.now()}-4 0.65s 0.5s forwards cubic-bezier(.17,.67,.4,.99);
        }
        #${particleContainer.id} .score-particle:nth-child(5) {
          animation: particleFly${Date.now()}-5 0.6s 0.5s forwards cubic-bezier(.17,.67,.4,.99);
        }
        
        @keyframes popAndDisappear${Date.now()} {
          0% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.3);
          }
          30% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.7);
          }
        }
        
        @keyframes particleFly${Date.now()}-1 {
          0% { 
            opacity: 0;
            left: -10px;
            top: -10px;
          }
          10% {
            opacity: 1;
            left: -10px;
            top: -10px;
          }
          100% { 
            opacity: 0;
            left: ${distanceX - 10}px;
            top: ${distanceY - 10}px;
          }
        }
        
        @keyframes particleFly${Date.now()}-2 {
          0% { 
            opacity: 0;
            left: 10px;
            top: -5px;
          }
          10% {
            opacity: 1;
            left: 10px;
            top: -5px;
          }
          100% { 
            opacity: 0;
            left: ${distanceX + 10}px;
            top: ${distanceY - 5}px;
          }
        }
        
        @keyframes particleFly${Date.now()}-3 {
          0% { 
            opacity: 0;
            left: 0px;
            top: 0px;
          }
          10% {
            opacity: 1;
            left: 0px;
            top: 0px;
          }
          100% { 
            opacity: 0;
            left: ${distanceX}px;
            top: ${distanceY}px;
          }
        }
        
        @keyframes particleFly${Date.now()}-4 {
          0% { 
            opacity: 0;
            left: -5px;
            top: 10px;
          }
          10% {
            opacity: 1;
            left: -5px;
            top: 10px;
          }
          100% { 
            opacity: 0;
            left: ${distanceX - 5}px;
            top: ${distanceY + 10}px;
          }
        }
        
        @keyframes particleFly${Date.now()}-5 {
          0% { 
            opacity: 0;
            left: 10px;
            top: 10px;
          }
          10% {
            opacity: 1;
            left: 10px;
            top: 10px;
          }
          100% { 
            opacity: 0;
            left: ${distanceX + 10}px;
            top: ${distanceY + 10}px;
          }
        }
      `;
      
      document.head.appendChild(styleElement);
      
      // Position at match location
      scoreElement.style.left = `${scoreX}px`;
      scoreElement.style.top = `${scoreY}px`;
      
      // Add to DOM
      gameContainer.appendChild(scoreElement);
      
      // Clean up after animation and show sparkle exactly when animation arrives
      setTimeout(() => {
        // Create sparkle effect at the score display using Phaser when the animation arrives
        if (sparkleEmitter) {
          sparkleEmitter.emitParticleAt(actualScoreX, actualScoreY, 20);
        }
        
        // Flash the score text with a scale animation for emphasis
        if (scoreText) {
          scene.tweens.add({
            targets: scoreText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 150,
            yoyo: true,
            repeat: 1
          });
        }
      }, 700); // Timed to appear exactly when animation arrives
      
      // Cleanup styles and DOM elements
      setTimeout(() => {
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
        if (scoreElement.parentNode) {
          scoreElement.parentNode.removeChild(scoreElement);
        }
        if (particleContainer.parentNode) {
          particleContainer.parentNode.removeChild(particleContainer);
        }
      }, 1500);
      
      // We've removed the Phaser text trails since the CSS animation works better
      // This prevents small score numbers appearing all over the screen
      
      // Enhanced destruction animation with particles
      let completedAnimations = 0;
      matches.forEach((candy, index) => {
        // Emit particles for this candy type
        const emitter = particleEmitters[candy.candyType];
        if (emitter) {
          // Create particle explosion at candy position
          emitter.emitParticleAt(candy.x, candy.y, 20);
        }
        
        // Enhanced candy destruction animation with rotation and scaling
        scene.tweens.add({
          targets: candy,
          scaleX: 1.5, // First grow
          scaleY: 1.5,
          duration: 100,
          yoyo: true, // Then shrink
          ease: 'Sine.easeOut',
          onComplete: () => {
            // Second phase of animation: rotate and fade out
        scene.tweens.add({
          targets: candy,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          rotation: Math.PI * 2, // Full rotation
              duration: 200,
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
          }
        });
        
        // Stagger the animations slightly for better visual effect
        scene.time.delayedCall(index * 40, () => {
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
        
        // ONLY automatic cascade matches should count for combos
        // Initial user-made matches should NOT count as combo
        const previousMatches = findMatches();
        
        if (previousMatches.length > 0) {
          // Check if this was triggered by a user move
          if (isUserMoveRef.current) {
            // This is the user's initial match - reset the flag for next time
            console.log('⚠️ User-initiated match detected - NOT counting as combo');
            isUserMoveRef.current = false;
          } else {
            // This is an automatic match after cascade - it SHOULD count as combo
            console.log(`🔥 CASCADE COMBO! Found ${previousMatches.length} automatic matches`);
            
            // First automatic match is combo 1, next is combo 2, etc.
            // Use a callback to make sure we have the latest value
            setComboCount(prev => {
              console.log(`🔢 Combo counter increased to ${prev + 1}`);
              return prev + 1;
            });
          }
        } else {
          // No matches, reset the user move flag if it was set
          if (isUserMoveRef.current) {
            console.log('⚠️ Resetting user move flag (no matches found)');
            isUserMoveRef.current = false;
          }
        }
        
          checkForMatches();
        });
      }
    
    // Helper function to find matches without removing them
    function findMatches() {
      const matches = [];
      
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
      
      return matches;
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
      audio: {
        disableWebAudio: false,
        noAudio: false
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

    // Add party popper function in Phaser logic and expose to React
    function activatePartyPopper() {
      try {
        // Vibrate for party popper activation with proper error handling
        const vibrationSuccess = triggerVibration([100, 100, 200]);
        if (!vibrationSuccess) {
          console.log('Vibration failed during party popper activation, continuing without haptic feedback');
        }
        
        // Destroy random candies across the board (25-35% of candies)
        const totalCandies = GRID_ROWS * GRID_COLS;
        const numCandiesToDestroy = Math.floor(totalCandies * (0.25 + Math.random() * 0.1));
        const destroyedPositions = new Set<string>();
        
        // Select random positions to destroy
        while (destroyedPositions.size < numCandiesToDestroy) {
          const row = Math.floor(Math.random() * GRID_ROWS);
          const col = Math.floor(Math.random() * GRID_COLS);
          destroyedPositions.add(`${row}-${col}`);
        }
        
        // Create array of candies to destroy
        const candiesToDestroy: Candy[] = [];
        destroyedPositions.forEach((pos: string) => {
          const [row, col] = pos.split('-').map(Number);
          if (grid[row] && grid[row][col]) {
            candiesToDestroy.push(grid[row][col]);
          }
        });
        
        // Play party popper sound
        sounds.combo.play({
          volume: 0.6,
          detune: 200
        });
        
        // Create special visual effect at center of screen
        const centerX = game.scale.width / 2;
        const centerY = game.scale.height / 2;
        
        // Create explosion effect using existing particle assets
        const particles = scene.add.particles(centerX, centerY, 'particle', {
          speed: { min: 200, max: 400 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.6, end: 0 },
          blendMode: 'ADD',
          lifespan: 1000,
          gravityY: 300,
          quantity: 100
        });
        
        // Destroy the candies with animation - use the same function that handles matches
        removeMatches(candiesToDestroy);
        
        // Schedule cleanup of particle emitter
        scene.time.delayedCall(2000, () => {
          particles.destroy();
        });
        
        return true;
      } catch (error) {
        console.error('Error in party popper activation:', error);
        return false;
      }
    }
    
    // Add reshuffleGrid function in Phaser logic and expose to React
    function reshuffleGrid() {
      try {
        // Animate all candies falling down and fading out
        let total = 0, done = 0;
        // Vibrate for reshuffle start with proper error handling
        const vibrationSuccess = triggerVibration([100, 50, 100]);
        if (!vibrationSuccess) {
          console.log('Vibration failed during reshuffle, continuing without haptic feedback');
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
      } catch (error) {
        console.error('Error in reshuffleGrid:', error);
        // Fallback: try to refill grid without animation
        try {
          refillGridWithAnimation();
        } catch (fallbackError) {
          console.error('Fallback refill also failed:', fallbackError);
        }
      }
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
              // Vibrate for each candy landing (short pulse) with error handling
              // Only vibrate for the last candy to avoid too many vibration calls
              if (landed === total) {
                triggerVibration([10]);
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
    partyPopperRef.current = activatePartyPopper;
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
        size: Math.random() * 10 + 7,
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
    if (mintStatus !== 'idle') {
      setShowMintPopup(true);
    } else {
      setShowMintPopup(false);
    }
  }, [mintStatus]);

  // Force hide popup when game restarts
  useEffect(() => {
    if (!gameOver && mintStatus === 'success') {
      setMintStatus('idle');
      setShowMintPopup(false);
    }
  }, [gameOver, mintStatus]);
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

  // Blockchain transaction hooks for Play Again
  const { writeContract, data: playAgainHash, error: playAgainError, isPending: isPlayAgainPending } = useWriteContract()
  const { isLoading: isPlayAgainConfirming, isSuccess: isPlayAgainConfirmed } = useWaitForTransactionReceipt({
    hash: playAgainHash,
  })

  // Handle transaction status updates for Play Again
  useEffect(() => {
    if (isPlayAgainPending) {
      setTransactionStatus('pending')
      setShowTransactionPopup(true)
    } else if (isPlayAgainConfirming) {
      setTransactionStatus('pending')
    } else if (isPlayAgainConfirmed) {
      setTransactionStatus('confirmed')
      setTransactionHash(playAgainHash || null)
      // Auto-close popup after 2 seconds and restart game
      setTimeout(() => {
        setShowTransactionPopup(false)
        handleRestart()
        setTransactionStatus('idle')
      }, 2000)
    } else if (playAgainError) {
      setTransactionStatus('error')
      setShowTransactionPopup(true)
    }
  }, [isPlayAgainPending, isPlayAgainConfirming, isPlayAgainConfirmed, playAgainError, playAgainHash])

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
      // checkFaucetEligibility();
      
      // Check remaining claims before showing gift box
      checkRemainingClaims().then((remaining) => {
        if (remaining > 0) {
          // Show gift box after a short delay only if user has remaining claims
          // setTimeout(() => {
            setShowGiftBox(true);
          // }, 1000); // 2 second delay for smooth transition
        } else {
          console.log('Daily gift box limit reached. Gift box will not be shown.');
        }
      });
    }
  }, [gameOver, address, gameStartTime, gameDuration]);

  // Check remaining claims on component mount and when dependencies change
  // Note: Removed 10-second polling for better performance and reduced API calls
  useEffect(() => {
    checkRemainingClaims();
  }, [address, context?.user?.fid]); // Only check when address or fid changes
  

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
    if (!address || mintStatus === 'minting') return; // Prevent multiple clicks

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
    console.log('Mint status check:', { mintSuccess, isMinting, nftRecorded, mintStatus });
    
    // Only set success when transaction is confirmed (not loading) and successful
    if (mintSuccess && !isMinting && !nftRecorded) {
      console.log('Setting mint status to success');
      
      // Add a small delay to ensure minting popup shows for at least 2 seconds
      setTimeout(() => {
        setMintStatus('success');
        setNftRecorded(true); // Prevent duplicate calls
        
        // Refresh mint eligibility data after successful mint
        // if (address) {
        //   checkFaucetEligibility();
        // }
        
        // Record NFT minting in database
        const recordNftMint = async () => {
          try {
            const { authenticatedFetch } = await import('@/lib/auth');
            const nftName = `ChainCrush NFT #${score}`;
            
            console.log('Recording NFT mint with data:', {
              fid: context.user.fid,
              nftName,
              userAddress: address
            });
            
            await authenticatedFetch('/api/nft-minted', {
              method: 'POST',
              body: JSON.stringify({
                fid: context.user.fid,
                nftName,
                userAddress: address
              })
            });
            
            console.log('NFT minting recorded successfully');
          } catch (error) {
            console.error('Failed to record NFT minting:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
          }
        };
        
        recordNftMint();
      }, 2000);
    } else if (isMintError && !isMinting) {
      setMintStatus('error');
      setMintError(mintErrorObj?.message || 'Minting failed');
    }
  }, [mintSuccess, isMinting, isMintError, mintErrorObj, nftRecorded]);



  

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Home-like Background Blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-purple-500/08 rounded-full blur-2xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-600/10 to-green-400/08 rounded-full blur-2xl" />
      </div>
      {/* Center radial glow */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          width: '60vw',
          height: '60vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.14), rgba(255,255,255,0.08) 40%, transparent 70%)',
          filter: 'blur(30px)'
        }} />
      </div>
      
      
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
      
      {/* Enhanced Loading Screen */}
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
          background: 'transparent',
          overflow: 'hidden'
        }}>
          {/* Home-like Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-purple-500/08 rounded-full blur-2xl" />
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-600/10 to-green-400/08 rounded-full blur-2xl" />
          </div>
          {/* Center radial glow */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              width: '60vw',
              height: '60vw',
              maxWidth: 600,
              maxHeight: 600,
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(255,255,255,0.16), rgba(255,255,255,0.10) 40%, transparent 70%)',
              filter: 'blur(30px)'
            }} />
          </div>
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '40px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            {/* Game Title */}
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: 'white',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              ChainCrush
            </div>
            
            {/* Animated Candy Icons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {['🔴', '🔵', '🟢', '🟡', '🟣'].map((candy, i) => (
                <div key={i} style={{
                  fontSize: '24px',
                  animation: `bounce 1s infinite ${i * 0.1}s ease-in-out`
                }}>
                  {candy}
                </div>
              ))}
            </div>
            
            {/* Enhanced Progress Bar */}
            <div style={{
              width: '280px',
              height: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '5px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ffffff, #f093fb)',
                borderRadius: '5px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
              }}></div>
            </div>
            
            {/* Loading Text */}
            <div style={{
              fontSize: '16px',
              marginTop: '16px',
              color: 'white',
              fontWeight: '500',
              letterSpacing: '1px'
            }}>
              Loading Game Assets: {loadingProgress}%
            </div>
            
            {/* Loading Message */}
            <div style={{
              fontSize: '14px',
              marginTop: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '280px'
            }}>
              {loadingProgress < 30 ? 'Preparing candy assets...' : 
               loadingProgress < 60 ? 'Loading game sounds...' : 
               loadingProgress < 90 ? 'Setting up the board...' : 
               'Almost ready to play!'}
          </div>
          </div>
          
          {/* Add animation keyframes */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); }
              }
              
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `
          }} />
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
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                // border: '1px solid rgba(255, 255, 255, 0.2)',
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
                    color: 'lightyellow',
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
                    const shareUrl = `https://farcaster.xyz/miniapps/djk3nS-wYTQu/chain-crush`;
                    
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
                        background: 'rgba(0, 0, 0, 0.1)', 
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
                
                {/* Placeholder for removed popup */}
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      // background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.98))',
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={() => setShowMintPopup(false)}
                  >
                    {/* Animated background elements */}
                    <div style={{
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      width: '100px',
                      height: '100px',
                      background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                      borderRadius: '50%',
                      animation: 'float 6s ease-in-out infinite',
                      zIndex: 1
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '20%',
                      right: '15%',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(138,43,226,0.3) 0%, transparent 70%)',
                      borderRadius: '50%',
                      animation: 'float 8s ease-in-out infinite reverse',
                      zIndex: 1
                    }} />
                    
                    {/* <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'relative',
                        width: 'min(95vw, 480px)',
                        maxHeight: '90vh',
                        borderRadius: '24px',
                        padding: '32px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        background: mintStatus === 'minting'
                          ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))'
                          : mintStatus === 'success'
                          ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))'
                          : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1))',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                        animation: 'slideInScale 0.4s ease-out',
                        zIndex: 2
                      }}
                    > */}
                      {/* Close Button */}
                      {/* <button
                        onClick={() => setShowMintPopup(false)}
                        aria-label="Close"
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '12px',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          zIndex: 3
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ✕
                      </button> */}

                      {/* Content */}
                      
                      
                  
                
              
                    {/* </div> */}
                  </div>
                {/* )} */}
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
          {mintStatus === 'idle' && address && canMintToday !== false && contractRemainingSupply !== BigInt(0) && (
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
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }}
            >
              🎴 Mint NFT
            </button>
          )}

          {/* Play Again Button - Show after successful mint OR when daily limit reached OR no wallet */}
          {(mintStatus === 'success' || mintStatus === 'error' || !address || (address && (canMintToday === false || contractRemainingSupply === BigInt(0)))) && (
            <button
              disabled={isPlayAgainPending || isPlayAgainConfirming}
              style={{ 
                position: 'fixed', 
                bottom: '40px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 2000,
                padding: '10px 20px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: isPlayAgainPending || isPlayAgainConfirming ? '#666' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isPlayAgainPending || isPlayAgainConfirming ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.5s ease',
                pointerEvents: 'auto',
                opacity: isPlayAgainPending || isPlayAgainConfirming ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isPlayAgainPending && !isPlayAgainConfirming) {
                  e.currentTarget.style.backgroundColor = '#4caf50';
                  e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPlayAgainPending && !isPlayAgainConfirming) {
                  e.currentTarget.style.backgroundColor = '#4caf50';
                  e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                }
              }}
              onClick={handleStartNewGame}
            >
              {isPlayAgainPending || isPlayAgainConfirming ? (
                <>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  {isPlayAgainPending ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                '▶ Play Again'
              )}
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
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        @keyframes successPulse {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
      `}</style>

      { gameInitialized && !gameOver && (
        <>
          {/* Home Button */}
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
          
          {/* Shop Button */}
          <div style={{ position: 'absolute', top: 10, right: 7, zIndex: 2001 }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 215, 0, 0.6)',
                color: '#333',
                fontWeight: '700',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ffe55c 0%, #fff176 100%)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
              }}
              onClick={() => setShowShop(true)}
            >
              <FontAwesomeIcon icon={faStore} />
            </button>
          </div>
        </>
      )}
      <ConfirmEndGameModal
        open={showConfirmEnd}
        onClose={() => setShowConfirmEnd(false)}
        onConfirm={() => {
          setShowConfirmEnd(false);
          setGameOver(true);
          setGameOverState(true); // show stats overlay if needed
        }}
        message="Quit game? Chill, your score's safe"
      />

      {/* No Boosters Left Popup */}
      {showBoosterPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
          <div 
            className="relative rounded-xl p-4 max-w-sm w-full text-center border border-white/20"
            style={{
              background: `
                linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(34, 197, 94, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%),
                linear-gradient(45deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 50%, rgba(59, 130, 246, 0.08) 100%)
              `,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowBoosterPopup(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 border-none text-white text-xs cursor-pointer flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            {/* Header */}
            <div className="mb-3">
              {/* <div className="text-3xl mb-2 animate-bounce">🔥</div> */}
              <h2 className="text-yellow-400 text-lg font-bold mb-1">
                BOOSTERS DEPLETED!
              </h2>
              <p className="text-white text-sm leading-relaxed">
                No more power-ups left! 💥<br/>
                <span className="text-yellow-400 font-bold">
                  Grab EPIC boosters at CRAZY prices!
                </span>
              </p>
            </div>

            {/* Discount banner */}
            <div 
              className="rounded-lg p-3 mb-4 border border-white/30"
              style={{
                background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.2), rgba(255, 215, 61, 0.2))',
                animation: 'glow 2s infinite alternate'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <FontAwesomeIcon icon={faBolt} className="text-white text-sm" />
                <span className="text-white text-sm font-bold">
                  LIMITED TIME OFFER!
                </span>
                <FontAwesomeIcon icon={faBolt} className="text-white text-sm" />
              </div>
              <p className="text-white text-xs font-bold">
                Both boosters for just 30K CRSH each! 🚀
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mb-3">
              <button
                onClick={() => {
                  setShowBoosterPopup(false);
                  setShowShop(true);
                }}
                className="w-full py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  color: '#333',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                }}
              >
                🛒 BUY BOOSTERS NOW!
              </button>
              
              <button
                onClick={() => setShowBoosterPopup(false)}
                className="w-full py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 hover:bg-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                Maybe Later 🤔
              </button>
            </div>

            {/* Pro tip */}
            <div 
              className="rounded-lg p-2 border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
              }}
            >
              <p className="text-yellow-400 text-xs font-bold m-0">
                💡 PRO TIP: You can buy boosters anytime from the shop icon at the top right!
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
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
      {/* Power-ups Container */}
      {gameInitialized && !gameOver && (totalReshuffles > 0 || totalPartyPoppers > 0) && (
        <div style={{ 
          position: 'fixed', 
          bottom: 13, 
          left: 0, 
          width: '100vw', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px', 
          zIndex: 2002,
          // padding: '0 20px'
        }}>
          {/* Reshuffle Button */}
          {totalReshuffles > 0 && (
            <button
              onClick={() => {
                if (boosterBusy) return;
                if (reshuffleGridRef.current) {
                  try {
                    setReshuffleError(null); // Clear any previous errors
                    setBoosterBusy(true);
                    reshuffleGridRef.current();
                    
                    // Use game boosters first, then database boosters
                    if (reshuffles > 0) {
                      setReshuffles(r => r - 1);
                    } else if (dbBoosters.shuffle > 0) {
                      setDbBoosters(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
                      // Update database immediately
                      updateDatabaseBoosters('shuffle', 1);
                    }
                    // Re-enable after animation/cascade likely completes
                    setTimeout(() => setBoosterBusy(false), 1600);
                  } catch (error) {
                    console.error('Reshuffle failed:', error);
                    setReshuffleError('Reshuffle failed, but grid was updated');
                    // Fallback: still decrement boosters even if animation fails
                    if (reshuffles > 0) {
                      setReshuffles(r => r - 1);
                    } else if (dbBoosters.shuffle > 0) {
                      setDbBoosters(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
                      updateDatabaseBoosters('shuffle', 1);
                    }
                    // Clear error after 3 seconds
                    setTimeout(() => setReshuffleError(null), 3000);
                    setTimeout(() => setBoosterBusy(false), 1200);
                  }
                } else {
                  setReshuffleError('Reshuffle not available yet');
                  setTimeout(() => setReshuffleError(null), 3000);
                }
              }}
              style={{
                background: onlyPurchasedReshuffles 
                  ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: onlyPurchasedReshuffles 
                  ? '2px solid rgba(255, 215, 0, 0.6)'
                  : '2px solid rgba(255, 255, 255, 0.3)',
                color: onlyPurchasedReshuffles ? '#333' : 'white',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '24px',
                padding: '10px 24px',
               cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: onlyPurchasedReshuffles 
                  ? '0 8px 32px rgba(255, 215, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.3)'
                  : '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                // minWidth: '140px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                opacity: boosterBusy ? 0.6 : 1,
                pointerEvents: boosterBusy ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                if (onlyPurchasedReshuffles) {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.8), 0 0 0 1px rgba(255, 215, 0, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffe55c 0%, #fff176 100%)';
                } else {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7c8ef0 0%, #8a5fb8 100%)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                if (onlyPurchasedReshuffles) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 215, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                } else {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <FontAwesomeIcon 
                icon={faShuffle} 
                style={{ 
                  fontSize: '18px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
              />
              <span style={{ 
                fontSize: '18px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {totalReshuffles}
              </span>
              {/* Show purchased booster indicator */}
              {dbBoosters.shuffle > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: '#333',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  $
                </div>
              )}
            </button>
          )}
          
          {/* Party Popper Button */}
          {totalPartyPoppers > 0 && (
            <button
              onClick={() => {
                if (boosterBusy) return;
                if (partyPopperRef.current) {
                  try {
                    setPartyPopperError(null); // Clear any previous errors
                    setBoosterBusy(true);
                    partyPopperRef.current();
                    
                    // Use game boosters first, then database boosters
                    if (partyPoppers > 0) {
                      setPartyPoppers(p => p - 1);
                    } else if (dbBoosters.partyPopper > 0) {
                      setDbBoosters(prev => ({ ...prev, partyPopper: prev.partyPopper - 1 }));
                      // Update database immediately
                      updateDatabaseBoosters('partyPopper', 1);
                    }
                    // Re-enable after effect/cascade window
                    setTimeout(() => setBoosterBusy(false), 2200);
                  } catch (error) {
                    console.error('Party Popper failed:', error);
                    setPartyPopperError('Party Popper failed');
                    // Fallback: still decrement boosters even if animation fails
                    if (partyPoppers > 0) {
                      setPartyPoppers(p => p - 1);
                    } else if (dbBoosters.partyPopper > 0) {
                      setDbBoosters(prev => ({ ...prev, partyPopper: prev.partyPopper - 1 }));
                      updateDatabaseBoosters('partyPopper', 1);
                    }
                    // Clear error after 3 seconds
                    setTimeout(() => setPartyPopperError(null), 3000);
                    setTimeout(() => setBoosterBusy(false), 1500);
                  }
                } else {
                  setPartyPopperError('Party Popper not available yet');
                  setTimeout(() => setPartyPopperError(null), 3000);
                }
              }}
              style={{
                background: onlyPurchasedPartyPoppers 
                  ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                  : 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%)',
                border: onlyPurchasedPartyPoppers 
                  ? '2px solid rgba(255, 215, 0, 0.6)'
                  : '2px solid rgba(255, 255, 255, 0.3)',
                color: onlyPurchasedPartyPoppers ? '#333' : 'white',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '24px',
                padding: '10px 24px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: onlyPurchasedPartyPoppers 
                  ? '0 8px 32px rgba(255, 215, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.3)'
                  : '0 8px 32px rgba(255, 107, 107, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                // minWidth: '140px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                opacity: boosterBusy ? 0.6 : 1,
                pointerEvents: boosterBusy ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                if (onlyPurchasedPartyPoppers) {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.8), 0 0 0 1px rgba(255, 215, 0, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffe55c 0%, #fff176 100%)';
                } else {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 107, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff7a7a 0%, #ff9e9e 50%, #ffb8b8 100%)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                if (onlyPurchasedPartyPoppers) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 215, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                } else {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 107, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%)';
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <FontAwesomeIcon 
                icon={faBurst} 
                style={{ 
                  fontSize: '18px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
              />
              <span style={{ 
                fontSize: '18px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {totalPartyPoppers}
              </span>
              {/* Show purchased booster indicator */}
              {dbBoosters.partyPopper > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: '#333',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  $
                </div>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Candy Crush Style Combo Animation */}
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
          {/* Brief flash on combo activation */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.3)',
            animation: 'comboFlash 0.3s ease-out forwards'
          }} />
          
          {/* Main combo container */}
          <div className="combo-container" style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Glow background */}
          <div style={{
            position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(255, 69, 0, 0.3) 60%, transparent 80%)',
              filter: 'blur(15px)',
              animation: 'comboGlowPulse 1.5s ease-out forwards',
              zIndex: -1
            }} />
            
            {/* Sweet Particles flying outward */}
            {Array.from({length: 16}).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: i % 3 === 0 ? '25px' : '15px',
                height: i % 3 === 0 ? '25px' : '15px',
                backgroundColor: 
                  i % 5 === 0 ? '#FF5722' : 
                  i % 4 === 0 ? '#FFC107' : 
                  i % 3 === 0 ? '#E91E63' : 
                  i % 2 === 0 ? '#2196F3' : 
                  '#4CAF50',
                borderRadius: i % 2 === 0 ? '50%' : '4px',
                boxShadow: `0 0 10px ${i % 5 === 0 ? '#FF5722' : i % 4 === 0 ? '#FFC107' : i % 3 === 0 ? '#E91E63' : i % 2 === 0 ? '#2196F3' : '#4CAF50'}`,
                animation: `comboParticle${i} 1.5s ease-out forwards`,
                opacity: 0
              }} />
            ))}
            
            {/* Main "COMBO" text */}
          <div style={{
              fontSize: comboCount >= 4 ? '90px' : '80px',
            fontWeight: 'bold',
              color: '#FFFFFF',
            textAlign: 'center',
              textShadow: '0 0 20px #FF9800, 0 0 40px #FF5722, 0 3px 0 #000000',
              animation: 'comboTextPop 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              transform: 'scale(0) rotate(-5deg)',
              opacity: 0,
              fontFamily: "'Bangers', cursive" // Candy Crush uses a fun, playful font
            }}>
              COMBO
          </div>
          
            {/* Multiplier with special styling for higher combos */}
          <div style={{
            position: 'absolute',
              top: comboCount >= 5 ? '-60px' : '-40px',
              right: comboCount >= 5 ? '-40px' : '-30px',
              fontSize: comboCount >= 5 ? '72px' : '64px',
              fontWeight: 'bold',
              color: comboCount >= 5 ? '#FFEB3B' : '#FFFFFF',
              textShadow: `0 0 20px ${comboCount >= 5 ? '#FF5722' : '#FF9800'}, 0 0 40px #FF5722, 0 3px 0 #000000`,
              background: `radial-gradient(circle, ${comboCount >= 5 ? 'rgba(255,59,0,0.9)' : 'rgba(255,152,0,0.85)'} 0%, ${comboCount >= 5 ? 'rgba(255,87,34,0.8)' : 'rgba(255,87,34,0.7)'} 100%)`,
            borderRadius: '50%',
              width: comboCount >= 5 ? '120px' : '100px',
              height: comboCount >= 5 ? '120px' : '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: `0 0 30px ${comboCount >= 5 ? 'rgba(255,59,0,0.8)' : 'rgba(255,152,0,0.7)'}, inset 0 0 20px rgba(255,255,255,0.6)`,
              animation: 'comboMultiplierPop 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              transform: 'scale(0) rotate(15deg)',
              opacity: 0,
              fontFamily: "'Bangers', cursive",
              zIndex: 10
            }}>
              {comboCount + 1}x
            </div>
            
            {/* Sparkles around the combo */}
            {Array.from({length: 12}).map((_, i) => (
              <div key={`sparkle-${i}`} style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                background: '#FFFFFF',
                borderRadius: '50%',
                boxShadow: '0 0 15px #FFEB3B, 0 0 30px #FF9800',
                animation: `comboSparkle${i} 2s ease-out infinite`,
                opacity: 0
              }} />
            ))}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes comboFlash {
            0% {
              opacity: 0;
            }
            20% {
              opacity: 0.4;
            }
            100% {
              opacity: 0;
            }
          }
          
          @keyframes comboGlowPulse {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            20% {
              opacity: 1;
              transform: scale(1.2);
            }
            70% {
              opacity: 0.7;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(1.5);
            }
          }
          
          @keyframes comboTextPop {
            0% {
              opacity: 0;
              transform: scale(0) rotate(-5deg);
            }
            15% {
              opacity: 1;
              transform: scale(1.3) rotate(3deg);
            }
            30% {
              transform: scale(0.9) rotate(-2deg);
            }
            45% {
              transform: scale(1.1) rotate(1deg);
            }
            60% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
            90% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: scale(1.2) rotate(0deg);
            }
          }
          
          @keyframes comboMultiplierPop {
            0% {
              opacity: 0;
              transform: scale(0) rotate(15deg);
            }
            15% {
              opacity: 0;
            }
            25% {
              opacity: 1;
              transform: scale(1.4) rotate(-5deg);
            }
            40% {
              transform: scale(0.8) rotate(3deg);
            }
            55% {
              transform: scale(1.1) rotate(-2deg);
            }
            70% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: scale(1.3) rotate(0deg);
            }
          }
          
          /* Generate particle animations dynamically */
          ${Array.from({length: 16}).map((_, i) => {
            // Calculate random directions for each particle
            const angle = (i * (360 / 16)) + (Math.random() * 20 - 10);
            const distance = 100 + (Math.random() * 50);
            const x = Math.cos(angle * (Math.PI / 180)) * distance;
            const y = Math.sin(angle * (Math.PI / 180)) * distance;
            const delay = Math.random() * 0.2;
            const duration = 0.7 + (Math.random() * 0.5);
            
            return `
            @keyframes comboParticle${i} {
              0% {
                opacity: 0;
                transform: translate(0, 0) scale(0) rotate(0deg);
              }
              10% {
                opacity: 1;
                transform: translate(${x * 0.1}px, ${y * 0.1}px) scale(0.8) rotate(${Math.random() * 30}deg);
              }
              70% {
                opacity: 1;
                transform: translate(${x * 0.6}px, ${y * 0.6}px) scale(1) rotate(${Math.random() * 180}deg);
            }
            100% {
              opacity: 0;
                transform: translate(${x}px, ${y}px) scale(0.5) rotate(${Math.random() * 360}deg);
              }
            }`;
          }).join('')}
          
          /* Generate sparkle animations dynamically */
          ${Array.from({length: 12}).map((_, i) => {
            // Position sparkles around the combo text
            const angle = (i * (360 / 12));
            const distance = 70 + (i % 3) * 40;
            const x = Math.cos(angle * (Math.PI / 180)) * distance;
            const y = Math.sin(angle * (Math.PI / 180)) * distance;
            const delay = Math.random() * 0.5;
            
            return `
            @keyframes comboSparkle${i} {
              0% {
                opacity: 0;
                transform: translate(${x * 0.5}px, ${y * 0.5}px) scale(0);
              }
              ${10 + (delay * 100)}% {
                opacity: 1;
                transform: translate(${x}px, ${y}px) scale(1.5);
              }
              ${60 + (delay * 100)}% {
                opacity: 1;
                transform: translate(${x}px, ${y}px) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(${x}px, ${y}px) scale(0.2);
              }
            }`;
          }).join('')}
        `
      }} />
      
      {/* Layered Bar Animation for 5+ Candy Matches */}
      {showLayeredBarAnimation && layeredBarData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 3001,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Position animation at exact candy match location */}
          <div style={{
            position: 'absolute',
            left: `${layeredBarData.x}px`,
            top: `${layeredBarData.y}px`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            
            {/* AMAZING! Text - Enhanced Styling */}
            <div
              style={{
                position: 'absolute',
                top: '-80px',
                fontSize: '32px',
                fontFamily: '"Bebas Neue", "Impact", "Arial Black", sans-serif',
                background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B35, #FFD700)',
                backgroundSize: '400% 400%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 107, 53, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5)',
                fontWeight: '900',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                opacity: 0,
                transform: 'scale(0.1)',
                animation: 'amazingTextPop 1.5s ease-out forwards, amazingGradient 2s ease-in-out infinite',
                animationDelay: '0.3s',
                filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.7))',
                WebkitTextStroke: '1px rgba(255, 255, 255, 0.3)'
              }}
            >
              AMAZING!
            </div>
            
          </div>
        </div>
      )}
      
      {/* Layered Bar Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes amazingTextPop {
            0% {
              opacity: 0;
              transform: scale(0.3) rotate(-5deg);
            }
            20% {
              opacity: 0.8;
              transform: scale(1.3) rotate(2deg);
            }
            40% {
              opacity: 1;
              transform: scale(1.1) rotate(-1deg);
            }
            60% {
              opacity: 1;
              transform: scale(1.2) rotate(1deg);
            }
            80% {
              opacity: 0.9;
              transform: scale(1.05) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: scale(1) rotate(0deg);
            }
          }
          
          @keyframes amazingGradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `
      }} />
      
      {/* Full Screen Mint Status Popup */}
      {showMintPopup && mintStatus !== 'idle' && (
        <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.5))',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={() => setShowMintPopup(false)}
      >
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(138,43,226,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
          zIndex: 1
        }} />
        
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(95vw, 480px)',
            maxHeight: '90vh',
            borderRadius: '24px',
            padding: '32px',
            border: '2px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            background: mintStatus === 'minting'
              ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))'
              : mintStatus === 'success'
              ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1))',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            animation: 'slideInScale 0.4s ease-out',
            zIndex: 2
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowMintPopup(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: '12px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              zIndex: 3
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          {/* Content */}
          {mintStatus === 'minting' && (
            <div style={{ textAlign: 'center' }}>
              {/* Animated NFT Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #ffd700, #ffa500)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                animation: 'pulse 2s ease-in-out infinite',
                boxShadow: '0 10px 30px rgba(255,215,0,0.3)'
              }}>
                🎴
              </div>
              
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #ffd700, #ffa500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Minting Your NFT...
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                Please wait while we confirm your transaction onChain.
              </p>
              
              {/* Loading Animation */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffd700',
                  animation: 'bounce 1.4s ease-in-out infinite both'
                }} />
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffa500',
                  animation: 'bounce 1.4s ease-in-out infinite both 0.2s'
                }} />
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ff8c00',
                  animation: 'bounce 1.4s ease-in-out infinite both 0.4s'
                }} />
              </div>
              
              <div style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                fontStyle: 'italic'
              }}>
                This may take a few moments...
              </div>
            </div>
          )}
          
          {mintStatus === 'success' && (
            <div style={{ textAlign: 'center' }}>
              {/* Success Animation */}
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '50px',
                animation: 'successPulse 0.6s ease-out',
                boxShadow: '0 15px 40px rgba(34,197,94,0.4)'
              }}>
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#22c55e',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                NFT Minted Successfully!
              </h2>
              
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                Your ChainCrush NFT has been added to your wallet. 
                <br />
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
                  Score: {score} | Level: {level}
                </span>
              </p>
              
              {/* Share Button */}
              <button
                onClick={handleShareNFT}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  marginBottom: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                }}
              >
                🚀 Share Your Achievement
              </button>
              
              <button
                onClick={() => setShowMintPopup(false)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                Continue
              </button>
            </div>
          )}
          
          {mintStatus === 'error' && (
            <div style={{ textAlign: 'center' }}>
              {/* Error Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #ef4444, #f87171)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                animation: 'shake 0.5s ease-in-out',
                boxShadow: '0 10px 30px rgba(239,68,68,0.3)'
              }}>
                <FontAwesomeIcon icon={faTimesCircle} />
              </div>
              
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ef4444',
                marginBottom: '16px'
              }}>
                Minting Failed
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                Something went wrong during the minting process. 
                Please try again or check your wallet connection.
              </p>
              
              <button
                onClick={() => setShowMintPopup(false)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Gift Box Modal */}
      {showGiftBox && (
        <GiftBox
          onClose={() => setShowGiftBox(false)}
          onClaimComplete={() => {
            // Refresh remaining claims after a successful claim
            checkRemainingClaims();
            setShowGiftBox(false);
            // Optional: show restart button or other UI
          }}
        />
      )}

      {/* Shop Modal */}
      {showShop && (
        <Shop
          onClose={() => setShowShop(false)}
          fid={context?.user?.fid}
          onPurchaseComplete={() => {
            // Refresh boosters after successful purchase
            fetchUserBoosters();
            setShowShop(false);
          }}
        />
      )}

      {/* Transaction Popup for Play Again */}
      {showTransactionPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.5))',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => {
            if (transactionStatus === 'error') {
              setShowTransactionPopup(false)
              setTransactionStatus('idle')
            }
          }}
        >
          {/* Animated background elements */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
            zIndex: 1
          }} />
          
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse',
            zIndex: 1
          }} />
          
          <div
            style={{
              position: 'relative',
              width: 'min(95vw, 480px)',
              maxHeight: '90vh',
              borderRadius: '24px',
              padding: '32px',
              border: '2px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              background: transactionStatus === 'pending'
                ? 'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(147,51,234,0.1))'
                : transactionStatus === 'confirmed'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1))',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              animation: 'slideInScale 0.4s ease-out',
              zIndex: 2
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - only show on error */}
            {transactionStatus === 'error' && (
              <button
                onClick={() => {
                  setShowTransactionPopup(false)
                  setTransactionStatus('idle')
                }}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '12px',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ✕
              </button>
            )}

            {/* Content */}
            <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 3 }}>
              {/* Status Icon */}
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {transactionStatus === 'pending' && (
                  <div
                    style={{ 
                      display: 'inline-block',
                      animation: 'spin 2s linear infinite',
                      filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))'
                    }}
                  >
                    <FontAwesomeIcon icon={faBolt} />
                  </div>
                )}
                {transactionStatus === 'confirmed' && (
                  <div style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.5))' }}>
                    ✅
                  </div>
                )}
                {transactionStatus === 'error' && (
                  <div style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>
                    ❌
                  </div>
                )}
              </div>

              {/* Status Text */}
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                // background: transactionStatus === 'pending'
                //   ? 'linear-gradient(135deg, #00ffff, #9333ea)'
                //   : transactionStatus === 'confirmed'
                //   ? 'linear-gradient(135deg, #22c55e, #10b981)'
                //   : 'linear-gradient(135deg, #ef4444, #f87171)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color:"#ffffff",
                // WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255,255,255,0.3)'
              }}>
                {transactionStatus === 'pending' && 'Starting New Game...'}
                {transactionStatus === 'confirmed' && 'Game Session Started!'}
                {transactionStatus === 'error' && 'Transaction Failed'}
              </h2>

              {/* Status Description */}
              <p style={{ 
                fontSize: '16px', 
                opacity: 0.9, 
                marginBottom: '24px', 
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto 24px auto'
              }}>
                {transactionStatus === 'pending' && 'Please wait while we register your new game session onChain...'}
                {transactionStatus === 'confirmed' && 'Your new game session has been registered! Starting the game now...'}
                {transactionStatus === 'error' && 'Something went wrong. Please try again or check your wallet connection.'}
              </p>

              {/* Transaction Hash */}
              {transactionHash && (
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    color: '#00ffff',
                    fontSize: '14px'
                  }}>
                    Transaction Hash:
                  </div>
                  <div style={{ 
                    opacity: 0.8,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {transactionHash}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {transactionStatus === 'error' && playAgainError && (
                <div style={{ 
                  background: 'rgba(239,68,68,0.1)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '14px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#ef4444',
                    fontSize: '16px'
                  }}>
                    Error Details:
                  </div>
                  
                  {/* User-friendly error message */}
                  <div style={{ 
                    opacity: 0.9, 
                    wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    marginBottom: '12px'
                  }}>
                    {(() => {
                      const errorMessage = playAgainError && typeof playAgainError === 'object' && 'message' in playAgainError ? playAgainError.message : 'Unknown error occurred';
                      
                      // Handle common error types with user-friendly messages
                      if (errorMessage.includes('User rejected the request') || errorMessage.includes('user rejected')) {
                        return '⚠️ Something went wrong. Please try again.';
                      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
                        return '💰 Insufficient funds for gas fees. Please add more ETH to your wallet.';
                      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
                        return '🌐 Network error. Please check your internet connection and try again.';
                      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
                        return '⏰ Transaction timed out. Please try again.';
                      } else if (errorMessage.includes('nonce') || errorMessage.includes('Nonce')) {
                        return '🔄 Transaction nonce error. Please try again.';
                      } else if (errorMessage.includes('gas') || errorMessage.includes('Gas')) {
                        return '⛽ Gas estimation failed. Please try again or increase gas limit.';
                      } else if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
                        return '🚫 Transaction was rejected by the smart contract.';
                      } else if (errorMessage.includes('connector.getChainId is not a function') || 
                                 errorMessage.includes('connector.getChainId') ||
                                 errorMessage.includes('getChainId is not a function')) {
                        // Auto-refresh page for connector errors
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                        return '🔄 Wallet connector error detected. Refreshing page...';
                      } else if (errorMessage.includes('denied') || errorMessage.includes('denied transaction')) {
                        return '⚠️ Something went wrong. Please try again.';
                      } else if (errorMessage.includes('already known') || errorMessage.includes('already pending')) {
                        return '⏳ Transaction is already pending. Please wait for confirmation.';
                      } else if (errorMessage.includes('underpriced') || errorMessage.includes('gas price too low')) {
                        return '⛽ Gas price too low. Please try again.';
                      } else if (errorMessage.includes('replacement transaction underpriced')) {
                        return '⛽ Replacement transaction gas price too low. Please try again.';
                      } else if (errorMessage.includes('max fee per gas less than block base fee')) {
                        return '⛽ Gas fee too low for current network conditions. Please try again.';
                      } else if (errorMessage.includes('transaction underpriced')) {
                        return '⛽ Transaction gas price too low. Please try again.';
                      } else if (errorMessage.includes('intrinsic gas too low')) {
                        return '⛽ Gas limit too low. Please try again.';
                      } else if (errorMessage.includes('out of gas')) {
                        return '⛽ Transaction ran out of gas. Please try again with higher gas limit.';
                      } else if (errorMessage.includes('bad instruction')) {
                        return '🚫 Invalid transaction data. Please try again.';
                      } else if (errorMessage.includes('bad jump destination')) {
                        return '🚫 Invalid transaction execution. Please try again.';
                      } else if (errorMessage.includes('stack overflow')) {
                        return '🚫 Transaction execution error. Please try again.';
                      } else if (errorMessage.includes('stack underflow')) {
                        return '🚫 Transaction execution error. Please try again.';
                      } else if (errorMessage.includes('invalid opcode')) {
                        return '🚫 Invalid transaction operation. Please try again.';
                      } else if (errorMessage.includes('call depth limit exceeded')) {
                        return '🚫 Transaction call depth exceeded. Please try again.';
                      } else if (errorMessage.includes('contract creation code storage out of gas')) {
                        return '⛽ Contract creation out of gas. Please try again.';
                      } else if (errorMessage.includes('precompiled contract failed')) {
                        return '🚫 Contract execution failed. Please try again.';
                      } else if (errorMessage.includes('invalid account')) {
                        return '🚫 Invalid account. Please check your wallet connection.';
                      } else if (errorMessage.includes('invalid signature')) {
                        return '🚫 Invalid signature. Please try again.';
                      } else if (errorMessage.includes('invalid nonce')) {
                        return '🔄 Invalid transaction nonce. Please try again.';
                      } else if (errorMessage.includes('invalid gas limit')) {
                        return '⛽ Invalid gas limit. Please try again.';
                      } else if (errorMessage.includes('invalid gas price')) {
                        return '⛽ Invalid gas price. Please try again.';
                      } else if (errorMessage.includes('invalid value')) {
                        return '💰 Invalid transaction value. Please try again.';
                      } else if (errorMessage.includes('invalid chain id')) {
                        return '🔗 Invalid network. Please switch to the correct network.';
                      } else if (errorMessage.includes('unsupported chain')) {
                        return '🔗 Unsupported network. Please switch to a supported network.';
                      } else if (errorMessage.includes('wallet not connected') || errorMessage.includes('not connected')) {
                        return '🔌 Wallet not connected. Please connect your wallet and try again.';
                      } else if (errorMessage.includes('wallet locked') || errorMessage.includes('locked')) {
                        return '🔒 Wallet is locked. Please unlock your wallet and try again.';
                      } else if (errorMessage.includes('wallet disconnected') || errorMessage.includes('disconnected')) {
                        return '🔌 Wallet disconnected. Please reconnect your wallet and try again.';
                      } else if (errorMessage.includes('provider not found') || errorMessage.includes('no provider')) {
                        return '🔌 No wallet provider found. Please install a wallet and try again.';
                      } else if (errorMessage.includes('user denied') || errorMessage.includes('user cancelled')) {
                        return '⚠️ Something went wrong. Please try again.';
                      } else if (errorMessage.includes('transaction failed') || errorMessage.includes('failed')) {
                        return '❌ Transaction failed. Please try again.';
                      } else if (errorMessage.includes('unknown error') || errorMessage.includes('Unknown error')) {
                        return '⚠️ Something went wrong. Please try again.';
                      } else {
                        // For any other error, show a generic message
                        return '⚠️ Something went wrong. Please try again.';
                      }
                    })()}
                  </div>

                  {/* Technical details (collapsible) */}
                  {(() => {
                    const errorMessage = playAgainError && typeof playAgainError === 'object' && 'message' in playAgainError ? playAgainError.message : '';
                    // Hide technical details by default for user rejections
                    const isUserRejection = errorMessage.includes('User rejected the request') || 
                                           errorMessage.includes('user rejected') ||
                                           errorMessage.includes('denied') || 
                                           errorMessage.includes('denied transaction') ||
                                           errorMessage.includes('user denied') || 
                                           errorMessage.includes('user cancelled');
                    
                    return (
                      <details style={{ marginTop: '12px' }} open={!isUserRejection}>
                        <summary style={{ 
                          cursor: 'pointer', 
                          color: '#f87171', 
                          fontSize: '13px',
                          fontWeight: 'bold',
                          marginBottom: '8px'
                        }}>
                          🔧 {isUserRejection ? 'Show Technical Details' : 'Technical Details'}
                        </summary>
                        <div style={{ 
                          fontSize: '12px', 
                          opacity: 0.7,
                          background: 'rgba(0,0,0,0.3)',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.2)',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          maxHeight: '150px',
                          overflowY: 'auto'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Error:</strong> Transaction was cancelled by user
                          </div>
                       
                        </div>
                      </details>
                    );
                  })()}
                </div>
              )}

              {/* Action Button */}
              {transactionStatus === 'error' && (
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  justifyContent: 'center',
                  marginTop: '8px'
                }}>
                  <button
                    onClick={() => {
                      setShowTransactionPopup(false)
                      setTransactionStatus('idle')
                      setTransactionHash(null)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowTransactionPopup(false)
                      setTransactionStatus('idle')
                      setTransactionHash(null)
                      // Retry the transaction
                      setTimeout(() => {
                        handleStartNewGame()
                      }, 100)
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #9333ea 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0,255,255,0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,255,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,255,0.3)'
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 