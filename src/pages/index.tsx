"use client";
import Banner from "@/components/Banner";
import VenueList from "@/components/VenueList";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col row-start-2 items-center sm:items-start">
        <Banner />
        <div id="bookings" className="w-full py-8">
          <VenueList />
        </div>
      </main>
    </div>
  );
}
