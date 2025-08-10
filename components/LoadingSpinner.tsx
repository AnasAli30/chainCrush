import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad, faRocket, faGem, faCoins, faBolt } from '@fortawesome/free-solid-svg-icons'

interface LoadingSpinnerProps {
  progress?: number
}

export default function LoadingSpinner({ progress = 0 }: LoadingSpinnerProps) {
  // Dynamic status messages based on progress
  const getStatusMessage = (progress: number) => {
    if (progress < 20) return 'Initializing Game Engine...'
    if (progress < 40) return 'Loading Phaser Framework...'
    if (progress < 60) return 'Preloading Game Assets...'
    if (progress < 80) return 'Setting Up Game Environment...'
    if (progress < 100) return 'Finalizing Game Setup...'
    return 'Almost Ready!'
  }

  const getSubMessage = (progress: number) => {
    if (progress < 20) return 'Starting your gaming adventure'
    if (progress < 40) return 'Loading game framework'
    if (progress < 60) return 'Fetching candy images and sounds'
    if (progress < 80) return 'Preparing the game board'
    if (progress < 100) return 'Last touches for the best experience'
    return 'Get ready to play!'
  }
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)'
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#00ffff', '#9333ea', '#22c55e', '#f59e0b', '#ef4444'][i % 5],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              y: [-20, 20, -20],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">
        {/* Game Logo/Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-purple-500 to-green-400 flex items-center justify-center shadow-2xl">
              <FontAwesomeIcon icon={faGamepad} className="text-4xl text-white" />
            </div>
            {/* Floating icons around main logo */}
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <FontAwesomeIcon icon={faCoins} className="text-sm text-white" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FontAwesomeIcon icon={faGem} className="text-sm text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Game Title */}
        <motion.h1
          className="text-5xl font-black mb-4 holographic-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          ChainCrush
        </motion.h1>

        {/* Loading Progress Bar */}
        <motion.div
          className="w-80 h-4 bg-white/10 rounded-full overflow-hidden mb-4 shadow-inner border border-white/20"
          initial={{ width: 0 }}
          animate={{ width: 320 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400 rounded-full relative overflow-hidden"
            style={{ width: `${Math.max(progress, 5)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>

        {/* Progress Percentage */}
        <motion.div
          className="text-white/90 text-sm font-bold mb-6"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {Math.round(progress)}%
        </motion.div>

        {/* Loading Text with Icons */}
        <motion.div
          className="flex items-center space-x-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FontAwesomeIcon icon={faBolt} className="text-2xl text-cyan-400" />
          </motion.div>
          <span className="text-xl font-bold text-white">
            {getStatusMessage(progress)}
          </span>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FontAwesomeIcon icon={faRocket} className="text-2xl text-purple-400" />
          </motion.div>
        </motion.div>

        {/* Loading Status */}
        <motion.p
          className="text-white/70 text-lg mb-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getSubMessage(progress)}
        </motion.p>

        {/* Animated Dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Fun Loading Tips */}
        <motion.div
          className="mt-8 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="text-sm text-white/60 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
            <p className="font-medium text-white/80 mb-1">💡 Pro Tip:</p>
            <p>Match 3+ candies to score big and climb the leaderboard!</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
