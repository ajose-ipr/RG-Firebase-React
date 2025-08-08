import { useNavigate } from 'react-router-dom';
import '../css/Main.css';

export default function Main() {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <div className="main-content">
        <h1 className="main-title">Welcome to Our Platform</h1>
        <div className="main-button-container">
          <button 
            onClick={() => navigate('/login')} 
            className="main-button"
          >
            Sign In to Your Account
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="main-button register"
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}