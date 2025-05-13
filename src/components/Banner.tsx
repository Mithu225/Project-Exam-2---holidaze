'use client';
import Image from "next/image";
const Banner = () => {
  const handleExploreClick = () => {
    const element = document.getElementById('venues');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full flex justify-center">
      <div className="max-w-screen-lg">
        <Image
          src="/asset/banner.png"
          alt="Banner"
          height={622}
          width={1024}
          className="w-full object-cover"
        />
      </div>

      <div className="absolute top-8 right-0">
        <div className="relative max-w-[1024px] mx-auto">
          <div className="bg-teal-500/80 rounded-tl-3xl rounded-bl-3xl p-4 text-center w-80">
            <p className="text-sm md:text-base font-medium text-white mb-2">
              Escape the ordinary.
            </p>
            <button
              onClick={handleExploreClick}
              className="bg-white rounded-full text-xs md:text-sm px-4 py-1 font-medium text-primary font-bold hover:bg-gray-50 transition-colors"
            >
              Explore now
            </button>
          </div>
        </div>
      </div>
    </div>
  );


};

export default Banner;