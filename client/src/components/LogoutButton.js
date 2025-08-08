// components/LogoutButton.js
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function LogoutButton() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/main');
  };

  return (
    <button className="btn btn-danger" onClick={logout}>
      Logout
    </button>
  );
}

export default LogoutButton;
