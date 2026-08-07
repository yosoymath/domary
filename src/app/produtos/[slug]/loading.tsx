export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-7xl animate-pulse gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.7fr)] lg:px-8">
      <div className="grid grid-cols-2 gap-2"><div className="aspect-square bg-black/5" /><div className="aspect-square bg-black/5" /></div>
      <div><div className="h-3 w-24 rounded bg-black/10" /><div className="mt-4 h-10 w-4/5 rounded bg-black/10" /><div className="mt-6 h-7 w-32 rounded bg-black/10" /><div className="mt-8 h-28 rounded bg-black/5" /><div className="mt-8 h-14 rounded-full bg-black/10" /></div>
    </div>
  );
}
