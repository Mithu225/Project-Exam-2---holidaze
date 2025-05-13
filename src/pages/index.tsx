"use client";
import Head from "next/head";
import Banner from "@/components/Banner";
import VenueList from "@/components/VenueList";

export default function Home() {
  return (
    <>
      <Head>
        <title>Holidaze - Find Your Perfect Holiday Venue</title>
        <meta
          name="description"
          content="Discover and book unique holiday venues for your perfect getaway. Browse through our selection of handpicked accommodations."
        />
      </Head>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center pb-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col row-start-2 items-center w-full max-w-screen-lg mx-auto px-4">
          <Banner />
          <div id="venues" className="w-full py-8">
            <VenueList />
          </div>
        </main>
      </div>
    </>
  );
}
