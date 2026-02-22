import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsed: string | null
}

interface CreatedKey {
  id: string
  name: string
  key: string
}

export default function ApiKeysPage() {
  const queryClient = useQueryClient()
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null)
  const [showKey, setShowKey] = useState(false)

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/apikey')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/apikey', { name })
      return res.data as CreatedKey
    },
    onSuccess: (data) => {
      setCreatedKey(data)
      setNewKeyName('')
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key created!')
    },
    onError: () => toast.error('Failed to create API key'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/apikey/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key revoked')
    },
    onError: () => toast.error('Failed to revoke key'),
  })

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Key className="w-6 h-6 text-brand-400" /> API Keys
        </h1>
        <p className="text-gray-400 mt-1">Manage keys for authenticating API requests.</p>
      </div>

      {/* Create key form */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-4">Create New Key</h2>
        <div className="flex gap-3">
          <input
            id="key-name-input"
            type="text"
            placeholder="Key name (e.g., production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            id="create-key-btn"
            onClick={() => newKeyName.trim() && createMutation.mutate(newKeyName.trim())}
            disabled={!newKeyName.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>

      {/* Newly created key reveal */}
      {createdKey && (
        <div className="mb-6 glass border border-brand-500/40 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium mb-1">Copy your key now — it won't be shown again.</p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-gray-900 rounded-lg px-3 py-2 text-sm text-brand-300 font-mono truncate">
                  {showKey ? createdKey.key : '•'.repeat(40)}
                </code>
                <button id="toggle-show-key" onClick={() => setShowKey(!showKey)} className="p-2 glass rounded-lg hover:bg-white/10 text-gray-400">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button id="copy-new-key-btn" onClick={() => copyKey(createdKey.key)} className="p-2 glass rounded-lg hover:bg-white/10 text-gray-400">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Your Keys</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{k.name}</p>
                  <p className="text-gray-500 text-xs font-mono">{k.prefix}••••••••</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Created {new Date(k.createdAt).toLocaleDateString()}</p>
                  <p>{k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleDateString()}` : 'Never used'}</p>
                </div>
                <button
                  id={`delete-key-${k.id}`}
                  onClick={() => deleteMutation.mutate(k.id)}
                  className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
