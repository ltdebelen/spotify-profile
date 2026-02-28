import Login from './Login';
import TasteProfile from './TasteProfile';

const App = () => {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    return <Login />;
  }

  return <TasteProfile code={code} />;
};

export default App;
