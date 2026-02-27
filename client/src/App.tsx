import Dashboard from './Dashboard';
import Login from './Login';

const code = new URLSearchParams(window.location.search).get('code');

const App = () => {
  return code ? <Dashboard code={code} /> : <Login />;
};

export default App;
