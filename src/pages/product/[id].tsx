'use client'
import ProductDetails from "@/components/ProductDetails";
import { useRouter } from 'next/router'

export default function Page() {
    const router = useRouter()
//   const params = useParams<{ id?: string }>()
  return <ProductDetails productId={router.query.id as string} />;
}