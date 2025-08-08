import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Main from './pages/Main';
import Entries from './pages/Entries';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/main" element={<Main />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/entries" element={<PrivateRoute><Entries /></PrivateRoute>} />
            <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          </Routes>
        </DataProvider> 
      </AuthProvider>
    </Router>
  );
}

export default App;