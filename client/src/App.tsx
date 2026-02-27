import Dashboard from './Dashboard';
import Login from './Login';

const App = () => {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    return <Login />;
  }

  return <Dashboard code={code} />;
};

export default App;
