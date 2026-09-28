from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = Path(__file__).resolve().parent / 'todos.db'
app = FastAPI(title='Little List API')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'], allow_methods=['*'], allow_headers=['*'])

def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db

with connect() as db:
    db.execute('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL)')

class NewTodo(BaseModel):
    text: str

class TodoUpdate(BaseModel):
    done: bool

class Reorder(BaseModel):
    ids: list[int]

def convert(row):
    return {'id': row['id'], 'text': row['text'], 'done': bool(row['done']), 'position': row['position']}

@app.get('/api/todos')
def list_todos():
    with connect() as db:
        return [convert(row) for row in db.execute('SELECT * FROM todos ORDER BY position, id').fetchall()]

@app.post('/api/todos', status_code=201)
def add_todo(item: NewTodo):
    text = item.text.strip()
    if not text:
        raise HTTPException(400, 'Please enter a task.')
    with connect() as db:
        position = db.execute('SELECT COALESCE(MAX(position), -1) + 1 FROM todos').fetchone()[0]
        cursor = db.execute('INSERT INTO todos (text, position) VALUES (?, ?)', (text, position))
        return convert(db.execute('SELECT * FROM todos WHERE id = ?', (cursor.lastrowid,)).fetchone())

@app.patch('/api/todos/{todo_id}')
def update_todo(todo_id: int, item: TodoUpdate):
    with connect() as db:
        cursor = db.execute('UPDATE todos SET done = ? WHERE id = ?', (int(item.done), todo_id))
        if not cursor.rowcount:
            raise HTTPException(404, 'Task not found.')
        return convert(db.execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone())

@app.delete('/api/todos/{todo_id}', status_code=204)
def delete_todo(todo_id: int):
    with connect() as db:
        if not db.execute('DELETE FROM todos WHERE id = ?', (todo_id,)).rowcount:
            raise HTTPException(404, 'Task not found.')

@app.put('/api/todos/order')
def reorder_todos(order: Reorder):
    with connect() as db:
        existing = {row[0] for row in db.execute('SELECT id FROM todos')}
        if len(order.ids) != len(existing) or set(order.ids) != existing:
            raise HTTPException(400, 'Order must include every task exactly once.')
        db.executemany('UPDATE todos SET position = ? WHERE id = ?', [(i, todo_id) for i, todo_id in enumerate(order.ids)])
    return {'ok': True}
