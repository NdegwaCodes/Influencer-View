import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="mt-2 text-slate-500">This campaign does not exist or is not assigned to you.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white">
        Go to your dashboard
      </Link>
    </div>
  );
}
