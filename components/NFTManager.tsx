'use client'

export default function NFTManager() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#19adff] to-[#28374d] p-4 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">🎴</div>
        <h1 className="text-4xl font-bold text-white">Coming Soon</h1>
        <p className="text-lg text-white max-w-md">
          NFT management features are under development. 
          Stay tuned for exciting new features!
        </p>
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-[#19adff] mb-3">What's Coming?</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🖼️</div>
              <div>
                <p className="font-semibold text-[#19adff]">NFT Gallery</p>
                <p className="text-sm text-[#28374d]">View and manage your ChainCrush NFTs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎨</div>
              <div>
                <p className="font-semibold text-[#19adff]">Customization</p>
                <p className="text-sm text-[#28374d]">Customize your NFT appearance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💎</div>
              <div>
                <p className="font-semibold text-[#19adff]">Rarity System</p>
                <p className="text-sm text-[#28374d]">Discover rare and legendary NFTs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 