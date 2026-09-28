import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, GripVertical, ListTodo, Plus, Trash2 } from 'lucide-react'

const API = '/api/todos'
async function request(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Something went wrong. Please try again.')
  }
  return response.status === 204 ? null : response.json()
}

export default function App() {
  const [todos, setTodos] = useState([]), [text, setText] = useState(''), [filter, setFilter] = useState('all'), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const remaining = todos.filter(todo => !todo.done).length
  const visible = useMemo(() => todos.filter(todo => filter === 'all' || (filter === 'active' ? !todo.done : todo.done)), [todos, filter])
  useEffect(() => { request(API).then(setTodos).catch(error => setError(error.message || 'Could not connect. Start the app using the README instructions.')).finally(() => setLoading(false)) }, [])

  async function addTodo(event) {
    event.preventDefault(); if (!text.trim()) return
    try { const todo = await request(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); setTodos(items => [...items, todo]); setText(''); setError('') } catch (e) { setError(e.message) }
  }
  async function toggleTodo(todo) {
    try { const updated = await request(`${API}/${todo.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: !todo.done }) }); setTodos(items => items.map(item => item.id === todo.id ? updated : item)); setError('') } catch (e) { setError(e.message) }
  }
  async function deleteTodo(id) {
    try { await request(`${API}/${id}`, { method: 'DELETE' }); setTodos(items => items.filter(todo => todo.id !== id)); setError('') } catch (e) { setError(e.message) }
  }
  async function saveOrder(next) {
    setTodos(next)
    try { await request(`${API}/order`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: next.map(item => item.id) }) }) }
    catch (e) { setError(e.message); request(API).then(setTodos).catch(() => {}) }
  }
  function moveTodo(todo, direction) {
    const from = todos.findIndex(item => item.id === todo.id), to = from + direction
    if (to < 0 || to >= todos.length) return
    const next = [...todos]; [next[from], next[to]] = [next[to], next[from]]; saveOrder(next)
  }
  function dropTodo(target) {
    const draggedId = window.draggedTodo
    if (!draggedId || draggedId === target.id) return
    const next = [...todos], from = next.findIndex(item => item.id === draggedId), to = next.findIndex(item => item.id === target.id)
    const [moved] = next.splice(from, 1); next.splice(to, 0, moved); window.draggedTodo = null; saveOrder(next)
  }

  return <main className="page">
    <header className="topbar"><a className="brand" href="#"><span className="brand-icon"><ListTodo size={19}/></span> little list</a><span className="saved"><span/> saved automatically</span></header>
    <section className="hero"><div className="eyebrow"><span className="sparkle">✳</span> A LITTLE SPACE FOR YOUR THOUGHTS</div><h1>Make room for<br/><em>what matters.</em></h1><p className="intro">One thing at a time. Add your tasks, then give yourself the satisfaction of checking them off.</p></section>
    <section className="list-card">
      <form className="add-form" onSubmit={addTodo}><span className="plus-icon"><Plus size={18}/></span><input value={text} onChange={e => setText(e.target.value)} placeholder="What would you like to get done?" aria-label="New task"/><button className="add-button" type="submit">Add task <span>↗</span></button></form>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="list-heading"><div><span className="section-label">YOUR LIST</span><span className="count">{todos.length}</span></div><div className="filters">{['all','active','done'].map(name => <button type="button" key={name} onClick={() => setFilter(name)} className={filter === name ? 'filter active-filter' : 'filter'}>{name === 'all' ? 'All' : name === 'active' ? 'To do' : 'Done'}</button>)}</div></div>
      <div className="task-list">{loading ? <div className="empty">Getting your list ready…</div> : visible.length === 0 ? <div className="empty"><span className="empty-check">{todos.length === 0 ? '✳' : '✓'}</span><strong>{todos.length === 0 ? 'A fresh start.' : filter === 'active' ? 'Nothing left to do.' : 'Nothing checked off yet.'}</strong><span>{todos.length === 0 ? 'Add a task above and take it from there.' : 'Your list will show it here.'}</span></div> : visible.map(todo => <article className={`task ${todo.done ? 'is-done' : ''}`} key={todo.id} draggable onDragStart={() => { window.draggedTodo = todo.id }} onDragOver={e => e.preventDefault()} onDrop={() => dropTodo(todo)}>
        <button type="button" className="drag" title="Drag to move" aria-label="Drag to move"><GripVertical size={17}/></button><button type="button" className="check" onClick={() => toggleTodo(todo)} aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}>{todo.done && <Check size={14}/>}</button><span className="task-text">{todo.text}</span><div className="task-actions"><button type="button" onClick={() => moveTodo(todo, -1)} title="Move up" aria-label="Move up"><ArrowUp size={15}/></button><button type="button" onClick={() => moveTodo(todo, 1)} title="Move down" aria-label="Move down"><ArrowDown size={15}/></button><button type="button" onClick={() => deleteTodo(todo.id)} title="Delete task" aria-label="Delete task" className="delete"><Trash2 size={15}/></button></div>
      </article>)}</div>
      <footer className="list-footer"><span>{remaining === 0 && todos.length > 0 ? 'All done — lovely work!' : `${remaining} ${remaining === 1 ? 'thing' : 'things'} left to do`}</span><span className="footer-note">Small steps count <span>✳</span></span></footer>
    </section><p className="bottom-note">A calmer way to keep track of things.</p>
  </main>
}
