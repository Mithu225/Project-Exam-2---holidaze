import { CartProvider } from "@/context/CartContext";
import Header from "./Header";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-grow w-full bg-white items-center justify-center">
          <main className="container flex-col px-4">{children}</main>
        </div>
        <Footer />
        <Toaster />
      </div>
    </CartProvider>
  );
}
