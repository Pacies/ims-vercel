export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-8 shadow-2xl animate-pulse">
        2K
      </div>

      {/* Loading Spinner */}
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6"></div>

      {/* Loading Text */}
      <div className="text-white text-xl font-medium mb-2">Initializing 2K Inventory</div>
      <div className="text-white/80 text-sm">Please wait...</div>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-white/20 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-white rounded-full animate-pulse" style={{ width: "70%" }}></div>
      </div>
    </div>
  )
}
