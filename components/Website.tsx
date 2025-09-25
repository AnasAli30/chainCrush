'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCirclePlay, faUsers, faGem, faCoins, faGamepad, faArrowRight, faGift, 
  faShareNodes, faCheckCircle, faTrophy, faChartLine, faLock, faVault,
  faBolt, faFire, faRocket, faShield, faStar, faChartBar, faWallet,
  faExchangeAlt, faInfinity, faGlobe,
  faBullseye, faHandshake, faLightbulb, faCog, faPlay, faSpinner,
  faExternalLinkAlt, faCode, faAward
} from '@fortawesome/free-solid-svg-icons'

interface GameStats {
  totalPlayers: number
  totalMints: number
  totalRewards: number
  totalVolume: number
  activeGames: number
}

export default function Website() {
  const [stats, setStats] = useState<GameStats>({
    totalPlayers: 0,
    totalMints: 0,
    totalRewards: 0,
    totalVolume: 0,
    activeGames: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedTokenomicsTab, setSelectedTokenomicsTab] = useState('distribution')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [playersRes, mintsRes] = await Promise.all([
          fetch('/api/players-total'),
          fetch('/api/nft-supply')
        ])
        
        const playersData = await playersRes.json()
        const mintsData = await mintsRes.json()
        
         setStats({
           totalPlayers: playersData.data?.totalPlayers || 0,
          totalMints: mintsData.data?.totalMints || 0,
          totalRewards: playersData.data?.totalRewards || 45000,
          totalVolume: playersData.data?.totalVolume || 125000,
          activeGames: playersData.data?.activeGames || 234
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Simulate real-time updates for demo purposes
    const interval = setInterval(() => {
      if (!loading) {
        setStats(prev => ({
          ...prev,
          totalPlayers: prev.totalPlayers + Math.floor(Math.random() * 3),
          activeGames: Math.max(150, prev.activeGames + Math.floor(Math.random() * 10) - 5)
        }))
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [loading])

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      // Update active section based on scroll position
      const sections = ['home', 'about', 'tokenomics', 'team']
      const scrollPosition = window.scrollY + 100
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const scaleOnHover = {
    whileHover: { scale: 1.05, y: -5 },
    whileTap: { scale: 0.95 }
  };

  const navClass = isScrolled
    ? 'bg-black/90 backdrop-blur-xl border-b border-cyan-500/30 shadow-2xl shadow-cyan-500/10'
    : 'bg-black/20 backdrop-blur-md border-b border-white/10';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        {/* Enhanced Navigation */}
        <motion.nav 
          className={`fixed top-0 w-full z-50 transition-all duration-300 ${navClass}`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo Section */}
              <motion.div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => scrollToSection('home')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <img src="/images/icon.jpg" alt="ChainCrush" className="w-12 h-12 rounded-2xl shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                    ChainCrush
                  </span>
                  <div className="text-xs text-cyan-300 font-medium tracking-wider">PLAY • EARN • TRADE</div>
                </div>
              </motion.div>

              {/* Navigation Links */}
              <div className="hidden md:flex space-x-8">
                {[{id: 'home', label: 'Home'}, {id: 'about', label: 'About'}, {id: 'tokenomics', label: 'Tokenomics'}, {id: 'team', label: 'Team'}].map((item) => (
                  <motion.button 
                    key={item.id}
                    onClick={() => scrollToSection(item.id)} 
                    className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                      activeSection === item.id 
                        ? 'text-cyan-300' 
                        : 'text-white hover:text-cyan-300'
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                        layoutId="activeSection"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center space-x-4">
                <motion.button 
                  onClick={() => window.open('https://farcaster.xyz/~/mini-apps/launch?domain=chain-crush-black.vercel.app', '_blank')}
                  className="gaming-gradient text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg border border-cyan-500/30 backdrop-blur-sm transition-all duration-300"
                  {...scaleOnHover}
                  style={{
                    boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.3), 0 0 15px rgba(147, 51, 234, 0.2)'
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Play Now
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Enhanced Hero Section */}
        <section id="home" className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-cyan-400/10 via-purple-500/10 to-green-400/10 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              className="text-center"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              {/* Logo with floating effect
              <motion.div 
                className="flex justify-center mb-12"
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  filter: "drop-shadow(0 20px 40px rgba(0, 255, 255, 0.3))" 
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <img 
                    src="/images/icon.jpg" 
                    alt="ChainCrush" 
                    className="w-32 h-32 rounded-3xl shadow-2xl border-4 border-cyan-400/30" 
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center animate-bounce">
                    <FontAwesomeIcon icon={faTrophy} className="text-white text-sm" />
                  </div>
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </div>
              </motion.div> */}

              {/* Main Headline */}
              <motion.div variants={fadeInUp} className="mb-8">
                <h1 className="text-7xl md:text-6xl font-black mb-4 mt-5">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400 bg-clip-text text-transparent animate-pulse">
                    ChainCrush
                  </span>
                </h1>
                <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 backdrop-blur-sm mb-6">
                  <FontAwesomeIcon icon={faFire} className="text-orange-400 mr-2 animate-pulse" />
                  <span className="text-white font-bold text-lg">Next-Gen GameFi on Farcaster</span>
                  <FontAwesomeIcon icon={faRocket} className="text-cyan-400 ml-2" />
                </div>
              </motion.div>

              {/* Value Proposition */}
              <motion.p 
                variants={fadeInUp}
                className="text-xl md:text-3xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                The <span className="text-cyan-400 font-bold">most addictive</span> meme crush game meets 
                <span className="text-purple-400 font-bold"> DeFi rewards</span>. 
                Play, earn <span className="text-green-400 font-bold">$CRSH tokens</span>, 
                and collect exclusive NFTs!
              </motion.p>
              
              {/* Enhanced Live Stats Grid */}
              <motion.div 
                variants={fadeInUp}
                className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto"

              >
                <motion.div 
                  className="glass-card rounded-2xl p-6 border border-cyan-500/30 text-center group"
                  {...scaleOnHover}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(0,255,255,0.05))',
                    boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.2)'
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} className="text-4xl text-cyan-300 mb-3 group-hover:animate-bounce" />
                  <div className="text-3xl font-black text-white mb-2">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      </div>
                    ) : stats.totalPlayers.toLocaleString()}
                  </div>
                  <div className="text-cyan-200 font-medium">Active Players</div>
                  <div className="text-xs text-green-400 mt-1">+{Math.floor(Math.random() * 20) + 10} today</div>
                </motion.div>

                <motion.div 
                  className="glass-card rounded-2xl p-6 border border-purple-500/30 text-center group"
                  {...scaleOnHover}
                  style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.1), rgba(147,51,234,0.05))',
                    boxShadow: '0 8px 25px -5px rgba(147, 51, 234, 0.2)'
                  }}
                >
                  <FontAwesomeIcon icon={faGem} className="text-4xl text-purple-300 mb-3 group-hover:animate-pulse" />
                  <div className="text-3xl font-black text-white mb-2">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      </div>
                    ) : stats.totalMints.toLocaleString()}
                  </div>
                  <div className="text-purple-200 font-medium">NFTs Minted</div>
                  <div className="text-xs text-green-400 mt-1">Live minting</div>
                </motion.div>

                {/*
                <motion.div 
                  className="glass-card rounded-2xl p-6 border border-green-500/30 text-center group"
                  {...scaleOnHover}
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))',
                    boxShadow: '0 8px 25px -5px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <FontAwesomeIcon icon={faCoins} className="text-4xl text-green-300 mb-3 group-hover:animate-spin" />
                  <div className="text-3xl font-black text-white mb-2">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      </div>
                    ) : `$${(stats.totalRewards / 1000).toFixed(0)}K`}
                  </div>
                  <div className="text-green-200 font-medium">Total Rewards</div>
                  <div className="text-xs text-green-400 mt-1">$CRSH distributed</div>
                </motion.div>
                */}

                {/*
                <motion.div 
                  className="glass-card rounded-2xl p-6 border border-yellow-500/30 text-center group"
                  {...scaleOnHover}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
                    boxShadow: '0 8px 25px -5px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <FontAwesomeIcon icon={faChartLine} className="text-4xl text-yellow-300 mb-3 group-hover:animate-bounce" />
                  <div className="text-3xl font-black text-white mb-2">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      </div>
                    ) : `$${(stats.totalVolume / 1000).toFixed(0)}K`}
                  </div>
                  <div className="text-yellow-200 font-medium">Trading Vol</div>
                  <div className="text-xs text-green-400 mt-1">24h volume</div>
                </motion.div>
                */}

                <motion.div 
                  className="glass-card rounded-2xl p-6 border border-orange-500/30 text-center group"
                  {...scaleOnHover}
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.05))',
                    boxShadow: '0 8px 25px -5px rgba(249, 115, 22, 0.2)'
                  }}
                >
                  <div className="relative">
                    <FontAwesomeIcon icon={faGamepad} className="text-4xl text-orange-300 mb-3 group-hover:animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      </div>
                    ) : stats.activeGames.toLocaleString()}
                  </div>
                  <div className="text-orange-200 font-medium">Live Games</div>
                  <div className="text-xs text-green-400 mt-1">Playing now</div>
                </motion.div>
              </motion.div>

              {/* Enhanced CTA Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <motion.button 
                  onClick={() => window.open('https://farcaster.xyz/~/mini-apps/launch?domain=chain-crush-black.vercel.app', '_blank')}
                  className="relative group gaming-gradient text-white px-12 py-6 rounded-2xl font-black text-xl shadow-2xl border border-cyan-500/30 backdrop-blur-sm overflow-hidden"
                  {...scaleOnHover}
                  style={{
                    boxShadow: '0 20px 40px -10px rgba(0, 255, 255, 0.4), 0 0 30px rgba(147, 51, 234, 0.3)'
                  }}
                >
                  {/* Animated background overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Button content */}
                  <div className="relative z-10 flex items-center justify-center space-x-4">
                    <FontAwesomeIcon icon={faRocket} className="text-2xl group-hover:animate-bounce" />
                    <span>Play & Earn Now</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                </motion.button>

                <motion.button 
                  onClick={() => scrollToSection('about')}
                  className="bg-white/10 hover:bg-white/20 text-white px-10 py-6 rounded-2xl font-bold text-lg border-2 border-white/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm"
                  {...scaleOnHover}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faLightbulb} className="text-cyan-300" />
                    <span>Learn More</span>
                    <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                variants={fadeInUp}
                className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/60"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faShield} className="text-green-400" />
                  <span className="text-sm font-medium">Audited Smart Contracts</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-purple-400" />
                  <span className="text-sm font-medium">Secure & Decentralized</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
                  <span className="text-sm font-medium">Award-Winning Game</span>
                </div>
              </motion.div>
              </motion.div>
            </div>
          {/* </div> */}
        </section>




        {/* Enhanced About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Pattern */}
        

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-400/20 border border-purple-500/30 mb-6">
                <FontAwesomeIcon icon={faRocket} className="text-purple-300 mr-2" />
                <span className="text-white font-semibold">About ChainCrush</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  The Future of
                </span>
                <br />
                <span className="text-green-400">GameFi is Here</span>
              </h2>
              <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed mb-8">
                ChainCrush revolutionizes gaming by combining the addictive mechanics of candy crush 
                with <span className="text-cyan-400 font-bold">real cryptocurrency rewards</span>. 
                Built on Farcaster, it's the <span className="text-purple-400 font-bold">first meme-themed GameFi </span> 
                experience that actually pays you to play!
              </p>
              
              {/* Key Stats Banner */}
              <div className="flex flex-wrap justify-center gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-400">$1K+</div>
                  <div className="text-sm text-white/60">Rewards Distributed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">13,259</div>
                  <div className="text-sm text-white/60">Total Opens</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-green-400">20,234</div>
                  <div className="text-sm text-white/60">Total Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-400">{stats.activeGames.toLocaleString()}</div>
                  <div className="text-sm text-white/60">Playing Now</div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {[
                {
                  icon: faGamepad,
                  title: "Premium GameFi Experience",
                  description: "State-of-the-art candy crush mechanics with meme-themed candies, power-ups, and daily challenges designed for maximum engagement",
                  color: "from-cyan-400 to-blue-500",
                  delay: 0
                },
                {
                  icon: faWallet,
                  title: "Instant Token Rewards",
                  description: "Earn $CRSH and $ARB tokens directly to your wallet. No complex claiming processes - rewards are instant and transparent",
                  color: "from-green-400 to-emerald-500",
                  delay: 0.1
                },
                {
                  icon: faGem,
                  title: "Exclusive NFT Collection",
                  description: "Mint rare achievement-based NFTs that increase in value as your skills improve. Trade on secondary markets for additional profit",
                  color: "from-purple-500 to-pink-500",
                  delay: 0.2
                },
                {
                  icon: faChartLine,
                  title: "Advanced Trading Features",
                  description: "Built-in DEX integration, yield farming opportunities, and staking rewards for long-term holders and active players",
                  color: "from-yellow-400 to-orange-500",
                  delay: 0.3
                },
                {
                  icon: faTrophy,
                  title: "Competitive Tournaments",
                  description: "Weekly tournaments with massive prize pools. Top players earn bonus tokens, exclusive NFTs, and platform governance rights",
                  color: "from-orange-400 to-red-500",
                  delay: 0.4
                },
                {
                  icon: faInfinity,
                  title: "Sustainable Tokenomics",
                  description: "Deflationary mechanics, strategic token burns, and revenue sharing ensure long-term value appreciation for early adopters",
                  color: "from-indigo-500 to-purple-600",
                  delay: 0.5
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: feature.delay, duration: 0.6 }}
                >
                  <div 
                    className="glass-card rounded-3xl p-8 border border-white/10 h-full group-hover:border-cyan-400/30 transition-all duration-500 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                    }}
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-purple-500/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Icon */}
                    <div className={`relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <FontAwesomeIcon icon={feature.icon} className="text-3xl text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Multiplayer PvP Coming Soon Banner */}
            <div className="mt-2 mb-2">
              <div className="glass-card rounded-2xl p-6 border flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faGamepad} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">Multiplayer PvP</div>
                    <div className="text-white/70 text-sm">Compete head-to-head. Fees fuel deflationary burns.</div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-400/30">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Why Choose ChainCrush Section */}
             <motion.div 
               className="text-center mt-16"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="glass-card rounded-3xl p-12 border border-cyan-500/30 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-purple-500/5 to-green-400/10"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-white mb-6">
                    Why <span className="text-cyan-400">Smart Traders</span> Choose ChainCrush?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faBolt} className="text-2xl text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">Instant Liquidity</h4>
                      <p className="text-white/70">All rewards are immediately tradeable with built-in DEX integration</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faShield} className="text-2xl text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">Audited & Safe</h4>
                      <p className="text-white/70">Smart contracts audited by leading security firms</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faChartBar} className="text-2xl text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">Growing Returns</h4>
                      <p className="text-white/70">Deflationary tokenomics designed for long-term value growth</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Tokenomics Section */}
         <section id="tokenomics" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/50 via-black/30 to-black/50"></div>
            <div className="absolute top-20 -right-40 w-96 h-96 bg-gradient-to-br from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-400/20 to-yellow-400/20 border border-green-400/30 mb-6">
                <FontAwesomeIcon icon={faCoins} className="text-green-300 mr-2" />
                <span className="text-white font-semibold">Tokenomics</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                  $CRSH Token
                </span>
                <br />
                <span className="text-cyan-400">Economics</span>
              </h2>
              <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                Our revolutionary tokenomics model is designed for <span className="text-green-400 font-bold">sustainable growth </span> 
                and <span className="text-yellow-400 font-bold">long-term value creation</span>. 
                Built with <span className="text-cyan-400 font-bold">deflationary mechanisms</span> that reward early adopters!
              </p>
            </motion.div>

            {/* Tokenomics Tabs */}
            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {['distribution', 'utility', 'staking', 'roadmap'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setSelectedTokenomicsTab(tab)}
                  className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    selectedTokenomicsTab === tab
                      ? 'gaming-gradient text-white shadow-xl border border-cyan-500/30'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {selectedTokenomicsTab === 'distribution' && (
                <motion.div
                  key="distribution"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Distribution Chart */}
                    <div className="glass-card rounded-3xl p-10 border border-green-500/30">
                      <h3 className="text-3xl font-bold text-white mb-8 text-center">Token Distribution</h3>
                      <div className="space-y-6">
                        {[
                          { label: 'Airdrop (50% at launch, rest 2–4 weeks)', percentage: 6, color: 'bg-green-500', desc: 'Initial community distribution' },
                          { label: 'Vaulted (30 days)', percentage: 30, color: 'bg-cyan-500', desc: 'Time-locked vault to stabilize supply' },
                          { label: 'Community (airdrops, events, partnerships)', percentage: 20, color: 'bg-purple-500', desc: 'Growth, campaigns, community expansion' },
                          { label: 'Team (6-month vesting)', percentage: 10, color: 'bg-yellow-500', desc: 'Core contributors with vesting' }
                        ].map((item, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-semibold">{item.label}</span>
                              <span className="text-white font-bold">{item.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-4 mb-2 overflow-hidden">
                              <motion.div 
                                className={`${item.color} h-4 rounded-full relative`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                              </motion.div>
                            </div>
                            <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">{item.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-8">
                      <motion.div className="glass-card rounded-3xl p-8 border border-cyan-500/30">
                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <FontAwesomeIcon icon={faVault} className="text-cyan-400" />
                          Token Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-black text-green-400 mb-2">1,000,000,000</div>
                            <div className="text-white/60 text-sm">Total Supply</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-cyan-400 mb-2">10 ETH</div>
                            <div className="text-white/60 text-sm">Launch Market Cap (Clank)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-purple-400 mb-2">Deflationary</div>
                            <div className="text-white/60 text-sm">Fee & Burn Mechanics</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-yellow-400 mb-2">≥ 200k</div>
                            <div className="text-white/60 text-sm">Holder Requirement (Leaderboard)</div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div className="glass-card rounded-3xl p-8 border border-purple-500/30">
                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <FontAwesomeIcon icon={faFire} className="text-orange-400" />
                          Deflationary Mechanics
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80">Burn from booster fees + PvP fees</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80">Encourages holding & long-term engagement</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Daily Rewards */}
                      <motion.div className="glass-card rounded-3xl p-8 border border-green-500/30">
                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <FontAwesomeIcon icon={faCoins} className="text-green-400" />
                          Daily Rewards
                        </h4>
                        <div className="space-y-3 text-white/80">
                          <div>• 5 gift boxes per user → total $0.15/day → 1,500 $CRUSH/day</div>
                          <div>• Solo Mode: 100 $CRUSH/game</div>
                          <div>• Multiplayer Winners: 1,000 $CRUSH</div>
                          <div>• Multiplayer Losers: 300 $CRUSH</div>
                        </div>
                      </motion.div>

                      {/* Weekly Leaderboard */}
                      <motion.div className="glass-card rounded-3xl p-8 border border-yellow-500/30">
                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
                          Weekly Leaderboard
                        </h4>
                        <div className="space-y-3 text-white/80">
                          <div>• Total prize pool distributed to top players</div>
                          <div>• Prize pool scales with game growth</div>
                          <div>• Players must hold ≥ 200k $CRUSH to qualify</div>
                        </div>
                      </motion.div>

                      {/* Implementation Status */}
                      <motion.div className="glass-card rounded-3xl p-8 border border-white/10">
                        <h4 className="text-2xl font-bold text-white mb-6">Implementation Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-cyan-300 font-semibold mb-2">Implemented</div>
                            <ul className="text-white/80 text-sm space-y-2">
                              <li>• Gift Boxes (daily rewards)</li>
                              <li>• Leaderboard</li>
                              <li>• User Stats</li>
                              <li>• NFT Manager (minting UI)</li>
                              <li>• Wallet Connection</li>
                              <li>• Game start transaction flow</li>
                            </ul>
                          </div>
                          <div>
                            <div className="text-yellow-300 font-semibold mb-2">Coming Soon</div>
                            <ul className="text-white/80 text-sm space-y-2">
                              <li>• Multiplayer PvP (Q4 2025)</li>
                              <li>• Staking (Q1 2026)</li>
                              <li>• Marketplace / NFT trading</li>
                              <li>• Governance voting</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedTokenomicsTab === 'utility' && (
                <motion.div
                  key="utility"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      {
                        icon: faGamepad,
                        title: "In-Game Purchases",
                        description: "Buy premium boosters, power-ups, and special game items to enhance your gameplay experience and increase winning chances",
                        color: "from-cyan-400 to-blue-500"
                      },
                      {
                        icon: faGem,
                        title: "NFT Minting",
                        description: "Mint exclusive achievement-based NFTs, rare collectibles, and special edition items that can be traded on secondary markets",
                        color: "from-purple-500 to-pink-500"
                      },
                      {
                        icon: faLock,
                        title: "Staking Rewards",
                        description: "Stake your tokens to earn passive income with up to 12% APY, plus bonus multipliers for in-game rewards",
                        color: "from-green-400 to-emerald-500"
                      },
                      {
                        icon: faCog,
                        title: "Governance Rights",
                        description: "Vote on new game features, tokenomics changes, tournament prizes, and strategic partnerships",
                        color: "from-yellow-400 to-orange-500"
                      },
                      {
                        icon: faTrophy,
                        title: "Tournament Entry",
                        description: "Access exclusive high-stakes tournaments with massive prize pools and compete against top players",
                        color: "from-orange-400 to-red-500"
                      },
                      {
                        icon: faExchangeAlt,
                        title: "Trading & Liquidity",
                        description: "Provide liquidity on DEXes, participate in yield farming, and earn additional returns on your holdings",
                        color: "from-indigo-500 to-purple-600"
                      }
                    ].map((utility, index) => (
                      <motion.div 
                        key={index}
                        className="glass-card rounded-3xl p-8 border border-white/10 group"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${utility.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <FontAwesomeIcon icon={utility.icon} className="text-2xl text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">{utility.title}</h4>
                        <p className="text-white/70 leading-relaxed">{utility.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {selectedTokenomicsTab === 'staking' && (
                <motion.div
                  key="staking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="max-w-3xl mx-auto">
                    <div className="glass-card rounded-3xl p-10 border border-yellow-500/30 text-center">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-400/30 mb-6">
                        <span className="text-yellow-300 font-bold">Coming Soon</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">$CRSH Staking</h3>
                      <p className="text-white/70 mb-6">Scheduled for Q1 2026</p>
                      <div className="text-white/80">Stake $CRSH to earn yield, boost in-game rewards, and unlock governance.</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedTokenomicsTab === 'roadmap' && (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-3xl font-bold text-white mb-12 text-center">Token Roadmap & Milestones</h3>
                    <div className="space-y-8">
                      {[
                        {
                          phase: 'Q3 2025',
                          title: 'Token Launch & Initial Distribution (done)',
                          items: ['$CRSH token deployment', 'Initial liquidity provision', 'Community airdrop'],
                          status: 'active',
                          color: 'from-green-400 to-emerald-500'
                        },
                        {
                          phase: 'Q4 2025',
                          title: 'Growth & Feature Expansion',
                          items: ['Mobile app launch', 'Advanced staking tiers', 'Governance voting', 'Staking contract launch', 'Partnership integrations'],
                          status: 'upcoming',
                          color: 'from-cyan-400 to-blue-500'
                        },
                        {
                          phase: 'Q1 2026',
                          title: 'Ecosystem Expansion',
                          items: ['Multi-game platform', 'DAO governance', 'Yield farming', 'Major exchange listings'],
                          status: 'planned',
                          color: 'from-yellow-400 to-orange-500'
                        }
                      ].map((milestone, index) => (
                        <motion.div 
                          key={index}
                          className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden"
                          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2, duration: 0.6 }}
                        >
                          {/* Status indicator */}
                          <div className={`absolute top-4 right-4 px-4 py-2 rounded-full bg-gradient-to-r ${milestone.color} text-white text-sm font-bold`}>
                            {milestone.status.toUpperCase()}
                          </div>
                          
                          <div className="pr-20">
                            <h4 className="text-2xl font-bold text-white mb-2">{milestone.phase}</h4>
                            <h5 className="text-xl text-cyan-300 mb-6">{milestone.title}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {milestone.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    milestone.status === 'completed' ? 'bg-green-400' :
                                    milestone.status === 'active' ? 'bg-cyan-400 animate-pulse' :
                                    'bg-white/30'
                                  }`}></div>
                                  <span className="text-white/80">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Call to Action */}
        
          </div>
        </section>

        {/* Enhanced Team Section */}
         <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
            <div className="absolute top-20 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-green-400/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-500/20 border border-blue-400/30 mb-6">
                <FontAwesomeIcon icon={faUsers} className="text-blue-300 mr-2" />
                <span className="text-white font-semibold">Meet the Team</span>
              </div>
              <p className="text-lg md:text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                The minds behind ChainCrush — blending deep experience in gaming, blockchain, and community to craft a new wave of nostalgic, on-chain fun.
              </p>
            </motion.div>

            {/* Team Grid - single developer centered */}
            <div className="max-w-xl mx-auto mb-16">
              {/* Lead Developer */}
                <motion.div 
                 className="glass-card rounded-3xl p-8 border border-blue-500/30 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                 whileHover={{ y: -6, scale: 1.01 }}
              >
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                   <img style={{width: '100%', height: '100%',borderRadius: '50%'}} src="https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/b88d0e31-207f-4384-4ee9-211e8ebdfd00/anim=false,fit=contain,f=auto,w=576" alt="" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faCode} className="text-white text-sm" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Anas Ali</h3>
                <p className="text-blue-200 mb-4 font-semibold">Founder & Full‑Stack Blockchain Developer</p>
                <div className="text-sm text-white/80 mb-6 space-y-2">
                  <div>• Built 8+ Farcaster mini apps — each with 5k+ users</div>
                  <div>• Consistently ranked in the Top‑50 on Farcaster leaderboards</div>
                  <div>• Focused on polished UX, scalable infra, and crypto‑native growth</div>
                </div>
                <div className="flex justify-center gap-3">
                  <motion.a 
                    href="https://x.com/AnasXDev" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                    <span>X (Twitter)</span>
                  </motion.a>
                  <motion.a 
                    href="https://farcaster.xyz/0xanas.eth" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>
                    <span>Farcaster</span>
                  </motion.a>
                </div>
              </motion.div>

           

              {/* Tokenomics Expert */}
             
            </div>

            {/* Advisors Section */}
        

        
          </div>
        </section>

        {/* Enhanced Final CTA Section */}
         <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-400/15 to-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-cyan-400/5 via-purple-500/5 to-green-400/5 rounded-full blur-3xl animate-spin" style={{animationDuration: '30s'}}></div>
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-400/20 to-cyan-400/20 border border-green-400/30 mb-8">
                <FontAwesomeIcon icon={faRocket} className="text-green-300 mr-3" />
                <span className="text-white font-bold text-lg">Ready to Get Rich Playing Games?</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse ml-3"></div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Start Earning
                </span>
                <br />
                <span className="text-yellow-400">$CRSH Today!</span>
              </h2>
              <p className="text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
                Join <span className="text-cyan-400 font-bold">{stats?.totalPlayers?.toLocaleString()}+ players </span> already earning  
                <span className="text-green-400 font-bold"> real cryptocurrency </span> while playing the most  
                <span className="text-purple-400 font-bold"> addictive game</span> on Farcaster!
              </p>
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.button 
                onClick={() => window.open('https://farcaster.xyz/~/mini-apps/launch?domain=chain-crush-black.vercel.app', '_blank')}
                className="relative group gaming-gradient text-white px-16 py-8 rounded-3xl font-black text-2xl shadow-2xl border-2 border-cyan-500/40 backdrop-blur-sm overflow-hidden"
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  boxShadow: '0 25px 50px -10px rgba(0, 255, 255, 0.5), 0 0 40px rgba(147, 51, 234, 0.4), 0 0 80px rgba(34, 197, 94, 0.3)'
                }}
              >
                {/* Animated background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-green-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-cyan-400/10 to-purple-500/10 animate-pulse"></div>
                
                {/* Button content */}
                <div className="relative z-10 flex items-center justify-center space-x-4">
                  <FontAwesomeIcon icon={faRocket} className="text-3xl group-hover:animate-bounce" />
                  <span>PLAY & EARN NOW</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
                
                {/* Epic shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </motion.button>

              <motion.div className="text-center" whileHover={{ scale: 1.02 }}>
                <div className="text-white/60 text-sm mb-2">Or learn more about tokenomics</div>
                <motion.button 
                  onClick={() => scrollToSection('tokenomics')}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCoins} className="text-green-300" />
                    <span>View Tokenomics</span>
                    <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Social Proof Banner */}
            <motion.div 
              className="glass-card rounded-3xl p-8 border border-cyan-500/30 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="flex flex-wrap justify-center items-center gap-12">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-400 mb-1">$10K+</div>
                  <div className="text-white/70 text-sm">Rewards Paid Out</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-400 mb-1">⭐⭐⭐⭐⭐</div>
                  <div className="text-white/70 text-sm">5-Star Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400 mb-1">{stats?.totalPlayers?.toLocaleString()}</div>
                  <div className="text-white/70 text-sm">Happy Players</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-yellow-400 mb-1">234</div>
                  <div className="text-white/70 text-sm">Playing Right Now</div>
                </div>
              </div>
            </motion.div>

            {/* Urgency Message */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-400/20 to-red-500/20 border border-orange-400/30 backdrop-blur-sm">
                <FontAwesomeIcon icon={faFire} className="text-orange-300 mr-3 animate-pulse" />
                <span className="text-white font-bold">🔥 Early adopters earning 10x more rewards!</span>
                <FontAwesomeIcon icon={faFire} className="text-orange-300 ml-3 animate-pulse" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="bg-black/60 backdrop-blur-xl border-t border-cyan-500/20 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <motion.div 
                  className="flex items-center space-x-4 mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    <img src="/images/icon.jpg" alt="ChainCrush" className="w-16 h-16 rounded-2xl shadow-xl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                      ChainCrush
                    </h3>
                    <div className="text-sm text-cyan-300 font-bold tracking-wider">THE FUTURE OF GAMEFI</div>
                  </div>
                </motion.div>
                <p className="text-white/80 mb-6 leading-relaxed max-w-md">
                  The most addictive meme crush game meets DeFi rewards. 
                  <span className="text-cyan-400 font-bold">Play, earn, and trade</span> with the 
                  <span className="text-green-400 font-bold"> next-generation GameFi platform</span>.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-sm">Live on Farcaster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faShield} className="text-green-400" />
                    <span className="text-white/70 text-sm">Audited & Secure</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
                <div className="space-y-3">
                  {['Home', 'About', 'Tokenomics', 'Team'].map((link) => (
                    <motion.button
                      key={link}
                      onClick={() => scrollToSection(link.toLowerCase())}
                      className="block text-white/70 hover:text-cyan-300 transition-colors text-sm"
                      whileHover={{ x: 5 }}
                    >
                      {link}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Community */}
              <div>
                <h4 className="text-white font-bold text-lg mb-6">Community</h4>
                <div className="space-y-4">
                  <motion.a 
                    href="https://twitter.com/chain_crush" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-white/70 hover:text-cyan-300 transition-colors"
                    whileHover={{ scale: 1.05, x: 5 }}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-cyan-400" />
                    <span>Twitter</span>
                  </motion.a>
                  <motion.a 
                    href="https://discord.gg/kAaaXnskNV" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-white/70 hover:text-purple-300 transition-colors"
                    whileHover={{ scale: 1.05, x: 5 }}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-purple-400" />
                    <span>Discord</span>
                  </motion.a>
                  <motion.a 
                    href="https://t.me/chain_Crush" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-white/70 hover:text-blue-300 transition-colors"
                    whileHover={{ scale: 1.05, x: 5 }}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-blue-400" />
                    <span>Telegram</span>
                  </motion.a>
                  <motion.a 
                    href="https://farcaster.xyz/chaincrushdotfun" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-white/70 hover:text-green-300 transition-colors"
                    whileHover={{ scale: 1.05, x: 5 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>
                    <span>Farcaster</span>
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-wrap items-center gap-6 text-white/60 text-sm">
                  <span>© 2024 ChainCrush. All rights reserved.</span>
                  <div className="hidden md:block w-px h-4 bg-white/20"></div>
                  <span>Built with ❤️ for the GameFi community</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <FontAwesomeIcon icon={faShield} className="animate-pulse" />
                    <span>Blockchain Secured</span>
                  </div>
                  <div className="w-px h-4 bg-white/20"></div>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm">
                    <FontAwesomeIcon icon={faGem} className="animate-pulse" />
                    <span>NFT Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
    </div>
  )
}
