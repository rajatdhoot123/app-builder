import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function BuildPage() {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState('');
  const [apps, setApps] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [config, setConfig] = useState({});
  const [newKey, setNewKey] = useState('');
  const [manifest, setManifest] = useState({
    permissions: [],
    features: [],
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const availablePermissions = [
    'android.permission.INTERNET',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.RECORD_AUDIO',
    'android.permission.NFC',
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_ADMIN',
  ];

  const availableFeatures = [
    'android.hardware.camera',
    'android.hardware.camera.autofocus',
    'android.hardware.location',
    'android.hardware.location.gps',
    'android.hardware.nfc',
    'android.hardware.bluetooth',
  ];
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
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:4000/build/gettemplates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
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

  const fetchConfig = async (app, flavor) => {
    try {
      const response = await axios.get(`http://localhost:4000/build/config/${app}/${flavor}`);
      if (response.data) {
        setConfig(response.data);
      } else {
        setConfig({
          BASE_URL: '',
          ANALYTICS_KEY: '',
          FIREBASE_PROJECT_ID: '',
          FLAVOR: flavor
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setConfig({
        BASE_URL: '',
        ANALYTICS_KEY: '',
        FIREBASE_PROJECT_ID: '',
        FLAVOR: flavor
      });
    }
  };

  useEffect(() => {
    if (selectedApp) {
      fetchFlavors(selectedApp);
    }
  }, [selectedApp]);

  useEffect(() => {
    if (selectedApp && selectedFlavor) {
      fetchConfig(selectedApp, selectedFlavor);
    }
  }, [selectedApp, selectedFlavor]);

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
    setSelectedFlavor(e.target.value);
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
  };

  const handleAddConfig = () => {
    if (newKey && !config[newKey]) {
      setConfig({ ...config, [newKey]: '' });
      setNewKey('');
    }
  };

  const handleRemoveConfig = (key) => {
    const newConfig = { ...config };
    delete newConfig[key];
    setConfig(newConfig);
  };

  const handleGenerate = async () => {
    const fullConfig = { ...config, manifest };
    const formData = new FormData();
    formData.append('app', selectedApp);
    formData.append('flavor', selectedFlavor);
    formData.append('config', JSON.stringify(fullConfig));
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
      // Navigate to the job page
      navigate(`/job/${response.data.jobId}`);
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
        <button onClick={() => navigate('/')} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => navigate('/jobs')} style={{ padding: '10px' }}>Jobs</button>
      </div>
      <div className="glass">
        <div>
          <label>Template:</label>
          <select value={selectedTemplate} onChange={(e) => {
            setSelectedTemplate(e.target.value);
            if (e.target.value) {
              const template = templates.find(t => t.id === parseInt(e.target.value));
              if (template) {
                setConfig(template.config);
              }
            }
          }}>
            <option value="">Select Template</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
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
            <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ marginRight: '10px', width: '150px' }}>{key}:</label>
              <input
                type="text"
                value={config[key]}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                style={{ flex: 1, marginRight: '10px' }}
              />
              <button onClick={() => handleRemoveConfig(key)} style={{ padding: '5px 10px' }}>Remove</button>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <input
              type="text"
              placeholder="New key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={{ marginRight: '10px', width: '150px' }}
            />
            <button onClick={handleAddConfig} style={{ padding: '5px 10px' }}>Add Config</button>
          </div>
        </div>
        <div>
          <h2>Android Manifest Editor</h2>

          <div>
            <h3>Permissions</h3>
            {availablePermissions.map(perm => (
              <label key={perm} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={manifest.permissions.includes(perm)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setManifest({ ...manifest, permissions: [...manifest.permissions, perm] });
                    } else {
                      setManifest({ ...manifest, permissions: manifest.permissions.filter(p => p !== perm) });
                    }
                  }}
                />
                {perm}
              </label>
            ))}
          </div>

          <div>
            <h3>Hardware Features</h3>
            {availableFeatures.map(feat => (
              <label key={feat} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={manifest.features.includes(feat)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setManifest({ ...manifest, features: [...manifest.features, feat] });
                    } else {
                      setManifest({ ...manifest, features: manifest.features.filter(f => f !== feat) });
                    }
                  }}
                />
                {feat}
              </label>
            ))}
          </div>

          <div>
            <h3>Intent Filters (Coming Soon)</h3>
            <p>Feature to edit intent filters will be added.</p>
          </div>
        </div>

        <button onClick={handleGenerate}>Generate Build</button>
      </div>
    </div>
  );
}

function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/build/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleDownload = (jobId) => {
    window.open(`http://localhost:4000/build/download/${jobId}`, '_blank');
  };

  return (
    <div className="App">
      <h1>Build Jobs</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => navigate('/jobs')} style={{ padding: '10px' }}>Jobs</button>
      </div>
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
                  <button onClick={() => navigate(`/job/${job.id}`)}>View</button>
                  {job.status === 'completed' && <button onClick={() => handleDownload(job.id)}>Download</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/build/job/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
    }
  };

  const handleDownload = (jobId) => {
    window.open(`http://localhost:4000/build/download/${jobId}`, '_blank');
  };

  if (!job) return <div>Loading...</div>;

  return (
    <div className="App">
      <h1>Job Details</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => navigate('/jobs')} style={{ padding: '10px' }}>Jobs</button>
      </div>
      <div className="glass">
        <h2>Job Details</h2>
        <p>App: {job.app}</p>
        <p>Flavor: {job.flavor}</p>
        <p>Status: {job.status}</p>
        <textarea
          readOnly
          value={job.logs.join('')}
          style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px' }}
        />
        {job.status === 'completed' && (
          <div>
            <button onClick={() => handleDownload(job.id)} style={{ marginRight: '10px' }}>Download</button>
            <button onClick={() => navigate(`/analyze/${job.id}`)}>Analyze APK</button>
          </div>
        )}
        <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
      </div>
    </div>
  );
}

function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:4000/build/gettemplates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName) return;
    // Assume current config is passed, but since no state, mock
    const config = {
      BASE_URL: 'https://example.com',
      ANALYTICS_KEY: 'key',
      FIREBASE_PROJECT_ID: 'id',
      FLAVOR: 'production',
    };
    try {
      await axios.post('http://localhost:4000/build/gettemplates', { name: newTemplateName, config });
      fetchTemplates();
      setNewTemplateName('');
    } catch (error) {
      alert('Error saving template');
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/build/gettemplates/${id}`);
      fetchTemplates();
    } catch (error) {
      alert('Error deleting template');
    }
  };

  return (
    <div className="App">
      <h1>Templates</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => navigate('/jobs')} style={{ padding: '10px' }}>Jobs</button>
      </div>
      <div className="glass">
        <h2>Manage Templates</h2>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <button onClick={saveTemplate}>Save Current Config as Template</button>
        </div>
        <ul>
          {templates.map(template => (
            <li key={template.id} style={{ marginBottom: '10px' }}>
              {template.name}
              <button onClick={() => deleteTemplate(template.id)} style={{ marginLeft: '10px' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AnalyzePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/build/analyze/${id}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!analysis) return <div>Loading analysis...</div>;

  if (analysis.error) return <div>Error: {analysis.error}</div>;

  return (
    <div className="App">
      <h1>APK Analysis</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginRight: '10px', padding: '10px' }}>Build</button>
        <button onClick={() => navigate('/jobs')} style={{ padding: '10px' }}>Jobs</button>
      </div>
      <div className="glass">
        <h2>Analysis Results</h2>
        <div style={{ marginBottom: '20px' }}>
          <h3>Total Size: {formatSize(analysis.totalSize)}</h3>
          <h3>Estimated Method Count: {analysis.methodCount}</h3>
          <h3>Native Libs Size: {formatSize(analysis.nativeLibsSize)}</h3>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Size Breakdown</h3>
          <ul>
            <li>Dex Files: {formatSize(analysis.sizeBreakdown.dex)}</li>
            <li>Assets: {formatSize(analysis.sizeBreakdown.assets)}</li>
            <li>Resources: {formatSize(analysis.sizeBreakdown.resources)}</li>
            <li>Native Libs: {formatSize(analysis.sizeBreakdown.nativeLibs)}</li>
            <li>Other: {formatSize(analysis.sizeBreakdown.other)}</li>
          </ul>
        </div>

        <div>
          <h3>Largest Files</h3>
          <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid white', padding: '8px' }}>File</th>
                <th style={{ border: '1px solid white', padding: '8px' }}>Size</th>
              </tr>
            </thead>
            <tbody>
              {analysis.largestFiles.map((file, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid white', padding: '8px' }}>{file.name}</td>
                  <td style={{ border: '1px solid white', padding: '8px' }}>{formatSize(file.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => navigate(`/job/${id}`)} style={{ marginTop: '20px' }}>Back to Job</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BuildPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/job/:id" element={<JobDetailPage />} />
        <Route path="/analyze/:id" element={<AnalyzePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
      </Routes>
    </Router>
  );
}

export default App;