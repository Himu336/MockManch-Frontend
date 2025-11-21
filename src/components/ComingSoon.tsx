export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto text-center mt-20">
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-white/60 text-lg">This feature is coming soon...</p>
    </div>
  );
}
