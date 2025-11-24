import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="editor-loading-container">
      <Loader2 size={32} className="dashboard-loading-spinner" />
    </div>
  )
}

