import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import TasteProfile from './TasteProfile';
import ArtistPage from './ArtistPage';

const App = () => {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path='/' element={<TasteProfile code={code} />} />
      <Route path='/artist/:artistName' element={<ArtistPage />} />
    </Routes>
  );
};

export default App;
