import Head from 'next/head';
import LoginForm from '@/components/form/LoginForm';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Holidaze</title>
        <meta name="description" content="Login to your Holidaze account" />
      </Head>
      
      <div className="bg-white flex flex-col justify-center pb-6 px-4 sm:px-6 lg:px-8">
        
        <div className="mt-8 mx-auto w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
