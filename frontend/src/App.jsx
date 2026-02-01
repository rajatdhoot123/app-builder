import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedApp, setSelectedApp] = useState('');
  const [apps, setApps] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [config, setConfig] = useState({
    BASE_URL: 'https://prod.example.com',
    ANALYTICS_KEY: 'prod-analytics-key',
    FIREBASE_PROJECT_ID: 'prod-project-id',
    FLAVOR: 'production'
  });
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [outputType, setOutputType] = useState('apk');
  const [buildMode, setBuildMode] = useState('release');
  const [jksFile, setJksFile] = useState(null);
  const [keystorePassword, setKeystorePassword] = useState('');
  const [keyAlias, setKeyAlias] = useState('');
  const [keyPassword, setKeyPassword] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await axios.get('http://localhost:4000/build/apps');
      setApps(response.data);
      if (response.data.length > 0) {
        setSelectedApp(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchFlavors = async (app) => {
    try {
      const response = await axios.get(`http://localhost:4000/build/flavors/${app}`);
      setFlavors(response.data.map(f => ({ value: f, label: f.charAt(0).toUpperCase() + f.slice(1) })));
      if (response.data.length > 0) {
        setSelectedFlavor(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching flavors:', error);
    }
  };

  useEffect(() => {
    if (selectedApp) {
      fetchFlavors(selectedApp);
    }
  }, [selectedApp]);

  useEffect(() => {
    const interval = setInterval(async () => {
      for (let job of jobs) {
        if (job.status !== 'completed' && job.status !== 'failed') {
          try {
            const response = await axios.get(`http://localhost:4000/build/job/${job.id}`);
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: response.data.status, logs: response.data.logs } : j));
          } catch (error) {
            console.error('Error fetching job status:', error);
          }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobs]);

  const handleAppChange = (e) => {
    setSelectedApp(e.target.value);
  };

  const handleFlavorChange = (e) => {
    const flavor = e.target.value;
    setSelectedFlavor(flavor);
    // Update config based on flavor
    let newConfig = { ...config, FLAVOR: flavor };
    if (flavor === 'production') {
      newConfig.BASE_URL = 'https://prod.example.com';
      newConfig.ANALYTICS_KEY = 'prod-analytics-key';
      newConfig.FIREBASE_PROJECT_ID = 'prod-project-id';
    } else if (flavor === 'staging') {
      newConfig.BASE_URL = 'https://staging.example.com';
      newConfig.ANALYTICS_KEY = 'staging-analytics-key';
      newConfig.FIREBASE_PROJECT_ID = 'staging-project-id';
    } else if (flavor === 'development') {
      newConfig.BASE_URL = 'https://dev.example.com';
      newConfig.ANALYTICS_KEY = 'dev-analytics-key';
      newConfig.FIREBASE_PROJECT_ID = 'dev-project-id';
    }
    setConfig(newConfig);
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
  };

  const handleGenerate = async () => {
    const formData = new FormData();
    formData.append('app', selectedApp);
    formData.append('flavor', selectedFlavor);
    formData.append('config', JSON.stringify(config));
    formData.append('outputType', outputType);
    formData.append('buildMode', buildMode);
    if (buildMode === 'release') {
      formData.append('jks', jksFile);
      formData.append('keystorePassword', keystorePassword);
      formData.append('keyAlias', keyAlias);
      formData.append('keyPassword', keyPassword);
    }

    try {
      const response = await axios.post('http://localhost:4000/build/build', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newJob = { id: response.data.jobId, app: selectedApp, flavor: selectedFlavor, status: 'running', logs: [] };
      setJobs(prev => [...prev, newJob]);
    } catch (error) {
      alert('Error starting build');
    }
  };

  const handleDownload = (jobId) => {
    window.open(`http://localhost:4000/build/download/${jobId}`, '_blank');
  };

  const selectJob = (job) => {
    setSelectedJob(job);
  };

  return (
    <div className="App">
      <h1>App Builder Dashboard</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button onClick={() => setSelectedJob(null)} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => setSelectedJob('queue')} style={{ padding: '10px' }}>Queue</button>
      </div>
      {!selectedJob && (
        <div className="glass">
          <div>
            <label>App:</label>
            <select value={selectedApp} onChange={handleAppChange}>
              {apps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Flavor:</label>
            <select value={selectedFlavor} onChange={handleFlavorChange}>
              {flavors.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Output Type:</label>
            <select value={outputType} onChange={(e) => setOutputType(e.target.value)}>
              <option value="apk">APK</option>
              <option value="aab">AAB</option>
            </select>
          </div>
          <div>
            <label>Build Mode:</label>
            <select value={buildMode} onChange={(e) => setBuildMode(e.target.value)}>
              <option value="release">Release</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          {buildMode === 'release' && (
            <div>
              <div>
                <label>JKS File:</label>
                <input type="file" accept=".jks" onChange={(e) => setJksFile(e.target.files[0])} />
              </div>
              <div>
                <label>Keystore Password:</label>
                <input type="password" value={keystorePassword} onChange={(e) => setKeystorePassword(e.target.value)} />
              </div>
              <div>
                <label>Key Alias:</label>
                <input type="text" value={keyAlias} onChange={(e) => setKeyAlias(e.target.value)} />
              </div>
              <div>
                <label>Key Password:</label>
                <input type="password" value={keyPassword} onChange={(e) => setKeyPassword(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <h2>Config</h2>
            {Object.keys(config).map(key => (
              <div key={key}>
                <label>{key}:</label>
                <input
                  type="text"
                  value={config[key]}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button onClick={handleGenerate}>Generate Build</button>
        </div>
      )}
      {selectedJob === 'queue' && (
        <div className="glass">
          <h2>Build Queue</h2>
          <table style={{ width: '100%', color: 'white' }}>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>App</th>
                <th>Flavor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.app}</td>
                  <td>{job.flavor}</td>
                  <td>{job.status}</td>
                  <td>
                    <button onClick={() => selectJob(job)}>View</button>
                    {job.status === 'completed' && <button onClick={() => handleDownload(job.id)}>Download</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedJob && selectedJob !== 'queue' && (
        <div className="glass">
          <h2>Job Details</h2>
          <p>App: {selectedJob.app}</p>
          <p>Flavor: {selectedJob.flavor}</p>
          <p>Status: {selectedJob.status}</p>
          <textarea
            readOnly
            value={selectedJob.logs.join('')}
            style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px' }}
          />
          {selectedJob.status === 'completed' && (
            <button onClick={() => handleDownload(selectedJob.id)}>Download</button>
          )}
          <button onClick={() => setSelectedJob(null)}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;