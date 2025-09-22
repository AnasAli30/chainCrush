'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTimes, 
  faGamepad, 
  faMousePointer, 
  faBolt, 
  faGift, 
  faTrophy, 
  faFire,
  faGem,
  faCoins,
  faShuffle,
  faBurst,
  faArrowRight,
  faCheckCircle,
  faStar,
  faUsers,
  faChartLine,
  faBullseye,
  faHandPointer,
  faDice,
  faFlag,
  faCheck,
  faXmark,
  faRotate,
  faHome,
  faCircle
} from '@fortawesome/free-solid-svg-icons'

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.9))',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={onClose}
      >
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse',
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite',
        }} />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            borderRadius: '32px 32px 0 0',
            border: '2px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(25px)',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.08), rgba(147,51,234,0.06), rgba(34,197,94,0.04))',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Handle bar */}
          <div style={{
            width: '60px',
            height: '6px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '3px',
            margin: '16px auto 8px auto',
            cursor: 'pointer'
          }} onClick={onClose} />

          {/* Close Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              zIndex: 1000,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </motion.button>

          {/* Scrollable Content Container */}
          <div 
            className="popup-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 24px 40px 24px',
              position: 'relative',
              zIndex: 2,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,255,255,0.3) rgba(255,255,255,0.1)',
              scrollBehavior: 'smooth'
            }}
          >
             {/* Header */}
             <motion.div
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               style={{ textAlign: 'center', marginBottom: '32px' }}
             >
               <div style={{ fontSize: '48px', marginBottom: '16px', color: '#00ffff' }}>
                 <FontAwesomeIcon icon={faGamepad} />
               </div>
               <h1 style={{ 
                 fontSize: '32px', 
                 fontWeight: '900', 
                 marginBottom: '8px',
                 background: 'linear-gradient(135deg, #00ffff, #9333ea, #22c55e)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 textShadow: '0 0 30px rgba(0,255,255,0.5)',
                 letterSpacing: '-0.5px'
               }}>
                 How to Play ChainCrush
               </h1>
               <p style={{ 
                 fontSize: '18px', 
                 opacity: 0.9, 
                 fontWeight: '500',
                 color: '#fff'
               }}>
                 Master the ultimate Web3 Chain Crush experience
               </p>
             </motion.div>

            {/* Game Basics */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#00ffff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faGamepad} />
                Game Basics
              </h2>
              
               <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                 <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faBullseye} style={{ color: '#00ffff', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#00ffff' }}>Objective:</strong> Match 3 or more identical Meme to clear them from the board and score points.
                   </div>
                 </div>
                 <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faHandPointer} style={{ color: '#00ffff', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#00ffff' }}>Controls:</strong> Click and drag to swap adjacent candies horizontally or vertically.
                   </div>
                 </div>
                 <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faDice} style={{ color: '#00ffff', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#00ffff' }}>Meme Types:</strong> 6 different Meme types with unique colors and patterns.
                   </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faFlag} style={{ color: '#00ffff', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#00ffff' }}>Goal:</strong> Match the required number of specific memes before running out of moves to advance to the next level.
                   </div>
                 </div>
               </div>
            </motion.div>

            {/* Matching Rules */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faMousePointer} />
                Matching Rules
              </h2>
              
               <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                 <div style={{ marginBottom: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                     <FontAwesomeIcon icon={faCheck} style={{ color: '#9333ea', marginTop: '2px', flexShrink: 0 }} />
                     <strong style={{ color: '#9333ea' }}>Valid Matches:</strong>
                   </div>
                   <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                     <li style={{ marginBottom: '4px' }}>3+ candies in a row (horizontal)</li>
                     <li style={{ marginBottom: '4px' }}>3+ candies in a column (vertical)</li>
                     <li style={{ marginBottom: '4px' }}>L-shapes and T-shapes count as matches</li>
                     <li>Matches can be longer than 3 for bonus points</li>
                   </ul>
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                     <FontAwesomeIcon icon={faXmark} style={{ color: '#9333ea', marginTop: '2px', flexShrink: 0 }} />
                     <strong style={{ color: '#9333ea' }}>Invalid Moves:</strong>
                   </div>
                   <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                     <li style={{ marginBottom: '4px' }}>Diagonal swaps are not allowed</li>
                     <li style={{ marginBottom: '4px' }}>Non-adjacent candy swaps</li>
                     <li>Moves that don't create matches</li>
                   </ul>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faRotate} style={{ color: '#9333ea', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#9333ea' }}>Chain Reactions:</strong> When Meme fall after a match, they can create new matches automatically, earning combo bonuses!
                   </div>
                 </div>
               </div>
            </motion.div>

            {/* Special Features */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faBolt} />
                Special Features
              </h2>
              
               <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                 <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faFire} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#22c55e' }}>Combos:</strong> Create multiple matches in sequence to build combo multipliers and earn massive points!
                   </div>
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                     <FontAwesomeIcon icon={faBolt} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                     <strong style={{ color: '#22c55e' }}>Power-ups:</strong>
                   </div>
                   <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                     <li style={{ marginBottom: '4px' }}><strong>Shuffle:</strong> Rearrange all candies on the board</li>
                     <li><strong>Party Popper:</strong> Clear a 3x3 area around selected candy</li>
                   </ul>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faGift} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#22c55e' }}>Gift Boxes:</strong> Complete games to unlock daily gift boxes with token rewards!
                   </div>
                 </div>
               </div>
            </motion.div>

            {/* Level Progression */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#ffd700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faTrophy} />
                Level Progression
              </h2>
              
              <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faBullseye} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                    <strong style={{ color: '#ffd700' }}>Challenge System:</strong>
                  </div>
                  <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                    <li style={{ marginBottom: '4px' }}>Each level requires matching specific meme types</li>
                    <li style={{ marginBottom: '4px' }}>Level 1: Match 10 specific memes</li>
                    <li style={{ marginBottom: '4px' }}>Level 2: Match 15 specific memes</li>
                    <li style={{ marginBottom: '4px' }}>Level 3: Match 20 specific memes</li>
                    <li>Each level adds +5 more memes to match</li>
                  </ul>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faCoins} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                    <strong style={{ color: '#ffd700' }}>Bonus Moves:</strong>
                  </div>
                  <div style={{ marginLeft: '24px' }}>When you complete a level, you get bonus moves equal to the next level's target!</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <FontAwesomeIcon icon={faDice} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#ffd700' }}>Random Targets:</strong> Each level randomly selects which meme type you need to match.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Scoring System */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#ff6b35',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faChartLine} />
                Scoring System
              </h2>
              
              <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faChartLine} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                    <strong style={{ color: '#ff6b35' }}>Base Points:</strong>
                  </div>
                  <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                    <li style={{ marginBottom: '4px' }}>3-match: 100 points</li>
                    <li style={{ marginBottom: '4px' }}>4-match: 200 points</li>
                    <li>5+ match: 300+ points</li>
                  </ul>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faFire} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                    <strong style={{ color: '#ff6b35' }}>Combo Multipliers:</strong>
                  </div>
                  <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                    <li style={{ marginBottom: '4px' }}>2x combo: Double points</li>
                    <li style={{ marginBottom: '4px' }}>3x combo: Triple points</li>
                    <li>4x+ combo: Massive multipliers!</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <FontAwesomeIcon icon={faTrophy} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#ff6b35' }}>Score Tracking:</strong> Your total score is tracked and saved when you complete levels or end the game.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Web3 Rewards */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,215,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 3s infinite'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  marginBottom: '20px',
                  color: '#ffd700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FontAwesomeIcon icon={faGift} />
                  Web3 Rewards
                </h2>
                
                 <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                   <div style={{ marginBottom: '16px' }}>
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                       <FontAwesomeIcon icon={faGift} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                       <strong style={{ color: '#ffd700' }}>Daily Gift Boxes:</strong>
                     </div>
                     <div style={{ marginLeft: '24px' }}>Complete games to unlock gift boxes containing:</div>
                     <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                       <li style={{ marginBottom: '4px' }}>ARB tokens</li>
                       <li style={{ marginBottom: '4px' }}>PEPE tokens</li>
                       <li style={{ marginBottom: '4px' }}>BOOP tokens</li>
                     </ul>
                   </div>
                   <div style={{ marginBottom: '16px' }}>
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                       <FontAwesomeIcon icon={faCoins} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                       <strong style={{ color: '#ffd700' }}>Daily Limits:</strong>
                     </div>
                     <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                       <li style={{ marginBottom: '4px' }}>5 gift box claims per 12-hour period</li>
                       <li style={{ marginBottom: '4px' }}>+2 bonus claims for sharing on Farcaster</li>
                       <li>Resets every 12 hours at 5:30 AM IST</li>
                     </ul>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                     <FontAwesomeIcon icon={faTrophy} style={{ color: '#ffd700', marginTop: '2px', flexShrink: 0 }} />
                     <div>
                       <strong style={{ color: '#ffd700' }}>Leaderboards:</strong> Compete with other players and climb the rankings for additional rewards!
                     </div>
                   </div>
                 </div>
              </div>
            </motion.div>

            {/* Tips & Strategies */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '20px', 
                padding: '24px',
                marginBottom: '32px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#ff6b35',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faStar} />
                Pro Tips
              </h2>
              
               <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#fff' }}>
                 <div style={{ marginBottom: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                     <FontAwesomeIcon icon={faBullseye} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                     <strong style={{ color: '#ff6b35' }}>Strategy:</strong>
                   </div>
                   <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                     <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Look for matches at the bottom first - they create cascading effects</span>
                     </li>
                     <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Save power-ups for difficult situations</span>
                     </li>
                     <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Plan moves to create multiple matches in sequence</span>
                     </li>
                     <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Watch for potential 4+ matches for bonus points</span>
                     </li>
                   </ul>
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                     <FontAwesomeIcon icon={faBolt} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                     <strong style={{ color: '#ff6b35' }}>Power-up Usage:</strong>
                   </div>
                   <ul style={{ marginTop: '8px', paddingLeft: '32px' }}>
                     <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Use Shuffle when no moves are available</span>
                     </li>
                     <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Party Popper works best on clustered candies</span>
                     </li>
                     <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <FontAwesomeIcon icon={faCircle} style={{ color: '#ff6b35', fontSize: '6px', marginTop: '8px', flexShrink: 0 }} />
                       <span>Save power-ups for higher levels with tougher targets</span>
                     </li>
                   </ul>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                   <FontAwesomeIcon icon={faHome} style={{ color: '#ff6b35', marginTop: '2px', flexShrink: 0 }} />
                   <div>
                     <strong style={{ color: '#ff6b35' }}>Game Over:</strong> If you run out of moves, click the home button at the top left corner to save your score and end the game.
                   </div>
                 </div>
               </div>
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #00ffff 0%, #9333ea 50%, #22c55e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '18px 48px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(0,255,255,0.3)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 12px 35px rgba(0,255,255,0.4)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button shine effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite'
              }} />
              
              <span style={{ position: 'relative', zIndex: 2 }}>
                <FontAwesomeIcon icon={faGamepad} />
                Start Playing Now!
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
