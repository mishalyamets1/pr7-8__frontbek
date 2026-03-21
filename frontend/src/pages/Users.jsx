import { useState, useEffect } from 'react';
import { usersAPI } from '../api';

export default function Users() {
  const [usersList, setUsersList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');

  const load = () => {
    usersAPI.getAll().then(res => setUsersList(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleBlock = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;
    await usersAPI.block(id);
    load();
  };

  const handleSaveRole = async (id) => {
    await usersAPI.update(id, { role: editRole });
    setEditingId(null);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Управление пользователями</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map(u => (
            <tr key={u.id}>
              <td style={{ fontSize: '0.8rem' }}>{u.id}</td>
              <td>{u.username}</td>
              <td>
                {editingId === u.id ? (
                  <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="user">user</option>
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                )}
              </td>
              <td>
                {u.blocked
                  ? <span className="badge badge-blocked">заблокирован</span>
                  : <span style={{ color: '#2e7d32' }}>активен</span>
                }
              </td>
              <td>
                {editingId === u.id ? (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveRole(u.id)}>Сохранить</button>{' '}
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingId(u.id); setEditRole(u.role); }}>
                      Изменить роль
                    </button>{' '}
                    {!u.blocked && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleBlock(u.id)}>
                        Заблокировать
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
