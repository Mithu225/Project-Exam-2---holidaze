import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-green-900 mb-4">Order Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! Your order has been successfully processed.
        </p>
        <Link
          href="/"
          className="inline-block bg-custom-button text-white py-2 px-6 rounded-md hover:bg-blue-950 transition-colors"
        >
          Buy More
        </Link>
      </div>
    </div>
  );
}