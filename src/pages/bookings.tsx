import Head from 'next/head';
import BookingList from '@/components/BookingList';

export default function BookingsPage() {
  return (
    <>
      <Head>
        <title>My Bookings | Holidaze</title>
        <meta name="description" content="View your current and upcoming bookings on Holidaze" />
      </Head>
      
      <div className="container mx-auto py-8">
        <BookingList />
      </div>
    </>
  );
}
