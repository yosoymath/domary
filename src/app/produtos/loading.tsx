export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-12 w-2/3 rounded-xl bg-black/10 sm:w-1/3" /><div className="mt-8 h-40 rounded-3xl bg-black/5" /><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div className="aspect-square rounded-2xl bg-black/5" key={index} />)}</div>
    </div>
  );
}
