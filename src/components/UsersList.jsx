import '../styles/components/UsersList.css';

const ROLE_LABELS = {
  patient: 'Pacjent',
  doctor: 'Lekarz',
  staff: 'Personel',
  admin: 'Administrator',
};

export default function UsersList({ users, canDelete = false, onEdit, onDelete }) {
  const getRoleColor = (role) => {
    const colors = {
      patient: '#3498db',
      doctor: '#27ae60',
      staff: '#e67e22',
      admin: '#e74c3c',
    };
    return colors[role] || '#95a5a6';
  };

  return (
    <div className="users-list">
      {users.length === 0 ? (
        <p className="empty-state">Brak użytkowników</p>
      ) : (
        <div className="users-grid">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-avatar">
                {user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3>{user.first_name} {user.last_name}</h3>
                <p className="user-email">{user.email}</p>
                <span
                  className="user-role"
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <div className="user-actions">
                <button className="btn-action btn-edit" onClick={() => onEdit && onEdit(user)}>Edytuj</button>
                {canDelete && (
                  <button className="btn-action btn-delete" onClick={() => onDelete && onDelete(user)}>Usuń</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
