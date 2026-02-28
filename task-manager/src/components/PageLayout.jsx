export default function PageLayout({ title, children }) {
  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg px-6 py-4 shadow-lg mb-6">
        <h1 className="text-3xl font-bold text-white m-0">{title}</h1>
      </div>

      {children}
    </div>
  );
}
