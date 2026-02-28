import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import TasteProfile from './TasteProfile';

const App = () => {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path='/' element={<TasteProfile code={code} />} />
    </Routes>
  );
};

export default App;
