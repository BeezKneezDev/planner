import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../store/useAuth'
import Modal from '../components/Modal'

const DEMO_EMAIL = 'demo@financialplanner.co.nz'

const CATEGORIES = ['Feature Request', 'Feedback & Bug', 'Discussion']

const CATEGORY_COLORS = {
  'Feature Request': 'bg-purple-100 text-purple-700',
  'Feedback & Bug': 'bg-red-100 text-red-700',
  'Discussion': 'bg-blue-100 text-blue-700',
}

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function PostForm({ form, setForm, onSubmit, onCancel, submitting, error, submitLabel, submittingLabel }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Post title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Describe your idea, feedback, or topic..."
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !form.title.trim() || !form.body.trim()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  )
}

function Replies({ postId, user, isDemo }) {
  const [replies, setReplies] = useState([])
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'replies'),
      orderBy('createdAt', 'asc'),
    )
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setReplies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setError('')
      },
      (err) => {
        console.error('Replies listener error:', err)
        setError('Could not load replies. Check Firestore rules.')
      },
    )
    return unsubscribe
  }, [postId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  const handleSendReply = async () => {
    if (!replyBody.trim()) return
    setSending(true)
    setError('')
    try {
      await addDoc(collection(db, 'posts', postId, 'replies'), {
        body: replyBody.trim(),
        authorEmail: user.email,
        createdAt: serverTimestamp(),
      })
      // Best-effort: update reply count on the post (may fail if user isn't the post author)
      updateDoc(doc(db, 'posts', postId), { replyCount: increment(1) }).catch(() => {})
      setReplyBody('')
    } catch (err) {
      console.error('Failed to send reply:', err)
      setError('Failed to send reply. Check Firestore rules.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Replies {replies.length > 0 && `(${replies.length})`}
      </h4>
      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}
      {!error && replies.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">No replies yet.</p>
      )}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="font-medium text-gray-600">{reply.authorEmail}</span>
              <span>{timeAgo(reply.createdAt?.toDate?.())}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {!isDemo && (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
            placeholder="Write a reply..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleSendReply}
            disabled={sending || !replyBody.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {sending ? '...' : 'Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Submit() {
  const { user } = useAuth()
  const isDemo = user?.email === DEMO_EMAIL
  const [posts, setPosts] = useState([])
  const [showNewPost, setShowNewPost] = useState(false)
  const [viewingPost, setViewingPost] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', category: CATEGORIES[0] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const updated = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setPosts(updated)
        // Keep viewingPost in sync with latest data
        if (viewingPost) {
          const fresh = updated.find((p) => p.id === viewingPost.id)
          if (fresh) setViewingPost(fresh)
        }
      },
      (err) => {
        console.error('Posts listener error:', err)
      },
    )
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmitNew = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'posts'), {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        authorEmail: user.email,
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', body: '', category: CATEGORIES[0] })
      setShowNewPost(false)
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = () => {
    setForm({
      title: viewingPost.title,
      body: viewingPost.body,
      category: viewingPost.category,
    })
    setError('')
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await updateDoc(doc(db, 'posts', viewingPost.id), {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
      })
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Failed to update post')
    } finally {
      setSubmitting(false)
    }
  }

  const closeViewModal = () => {
    setViewingPost(null)
    setEditing(false)
    setError('')
  }

  const canEdit = viewingPost && !isDemo && user?.email === viewingPost.authorEmail

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Community Board</h2>
        {!isDemo && (
          <button
            onClick={() => { setForm({ title: '', body: '', category: CATEGORIES[0] }); setError(''); setShowNewPost(true) }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
          >
            New Post
          </button>
        )}
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          Demo accounts can browse posts but cannot submit or reply.
        </div>
      )}

      {posts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          No posts yet. Be the first to share!
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => { setEditing(false); setViewingPost(post) }}
            className="bg-white rounded-xl shadow-sm p-5 w-full text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 truncate">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.body}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                {post.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span>{post.authorEmail}</span>
              <span>{timeAgo(post.createdAt?.toDate?.())}</span>
              {post.replyCount > 0 && (
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                  {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {showNewPost && (
        <Modal title="New Post" onClose={() => setShowNewPost(false)}>
          <PostForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmitNew}
            onCancel={() => setShowNewPost(false)}
            submitting={submitting}
            error={error}
            submitLabel="Post"
            submittingLabel="Posting..."
          />
        </Modal>
      )}

      {viewingPost && (
        <Modal title={editing ? 'Edit Post' : viewingPost.title} onClose={closeViewModal}>
          {editing ? (
            <PostForm
              form={form}
              setForm={setForm}
              onSubmit={handleSaveEdit}
              onCancel={() => setEditing(false)}
              submitting={submitting}
              error={error}
              submitLabel="Save"
              submittingLabel="Saving..."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className={`px-2 py-1 rounded-full ${CATEGORY_COLORS[viewingPost.category] || 'bg-gray-100 text-gray-600'}`}>
                    {viewingPost.category}
                  </span>
                  <span>{viewingPost.authorEmail}</span>
                  <span>{timeAgo(viewingPost.createdAt?.toDate?.())}</span>
                </div>
                {canEdit && (
                  <button
                    onClick={openEdit}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingPost.body}</p>
              <Replies postId={viewingPost.id} user={user} isDemo={isDemo} />
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
