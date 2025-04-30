'use client';
import Image from "next/image";
const Banner = () => {
  const handleExploreClick = () => {
    const element = document.getElementById('venues');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      
      <div className="w-full">
        <Image
          src="/asset/holidaze-banner.png"
          alt="Holidaze Banner"
          height={622}
          width={1440}
          className="w-full"
        />
      </div>

      
      <div className="absolute top-8 right-0 max-w-xs">
        <div className="bg-teal-500/80 rounded-tl-3xl rounded-bl-3xl p-4 text-center w-80">
          <p className="text-sm md:text-base font-medium text-white mb-2">Escape the ordinary.</p>
          <button
            onClick={handleExploreClick}
            className="bg-white rounded-full text-xs md:text-sm px-4 py-1 font-medium text-orange-500 hover:bg-gray-50 transition-colors"
          >
            Explore now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;