import Login from './Login';
import TasteProfile from './TasteProfile';
import Dashboard from './Dashboard';

const App = () => {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    return <Login />;
  }

  return <TasteProfile code={code} />;
  // return <Dashboard code={code} />;
};

export default App;
