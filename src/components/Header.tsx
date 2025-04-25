"use client";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import Image from "next/image";
import SearchBar from "./SearchBar";
import { useCart } from "@/context/CartContext";

export default function Header() {
 
  return (
    <header className="bg-white text-custom-blue shadow-md">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="p-0">
          <Image
            src="/asset/holidaze-header-logo.png"
            alt="Holidaze Logo"
            height={170}
            width={224}
          />
        </div>

       
      <SearchBar />
      <nav>
          <ul className="flex flex-col sm:flex-row font-bold gap-4">
            <li>
              <Link href="/login" className="hover:text-custom-blue  transition">
              Account
              </Link>
            </li>
            
           
          </ul>
        </nav>
   
      </div>
    </header>
  );
}
