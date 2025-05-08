"use client";
import Banner from "@/components/Banner";
import VenueList from "@/components/VenueList";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center pb-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col row-start-2 items-center w-full max-w-screen-lg mx-auto px-4">
        <Banner />
        <div id="venues" className="w-full py-8">
          <VenueList />
        </div>
      </main>
    </div>
  );
}
