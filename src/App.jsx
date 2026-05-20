import { useState, useCallback } from 'react';
import IntroScreen  from './components/IntroScreen';
import Gallery3D    from './components/Gallery3D';
import FolderViewer from './components/FolderViewer';

export default function App() {
  const [view, setView]                     = useState('intro');
  const [selectedFolder, setSelectedFolder] = useState(null);

  const handleExplore = () => setView('space');

  const handleSelectFolder = useCallback((folder) => {
    setSelectedFolder(folder);
    setView('viewer');
  }, []);

  const handleBack = useCallback(() => {
    setView('space');
    setTimeout(() => setSelectedFolder(null), 700);
  }, []);

  return (
    <div className="app">
      <IntroScreen
        onExplore={handleExplore}
        isVisible={view === 'intro'}
      />
      <Gallery3D
        onSelectFolder={handleSelectFolder}
        isVisible={view === 'space'}
      />
      <FolderViewer
        folder={selectedFolder}
        onBack={handleBack}
        isVisible={view === 'viewer'}
      />
    </div>
  );
}
