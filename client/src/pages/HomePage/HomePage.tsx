import ServerStatus from './ServerStatus'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <ServerStatus />
    </div>
  )
}
