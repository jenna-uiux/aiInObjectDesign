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

  // Note: we intentionally do NOT null out selectedFolder on back. Doing so
  // with a setTimeout was racing against the user picking a new folder, and
  // also it stranded the viewer's state on the previous folder until the
  // timeout fired. Instead we let the key prop below remount FolderViewer
  // whenever a different folder is chosen, which gives a fresh, correctly-
  // initialised viewer every time and avoids showing the previous folder's
  // image for a beat.
  const handleBack = useCallback(() => {
    setView('space');
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
        key={selectedFolder?.id ?? 'empty'}
        folder={selectedFolder}
        onBack={handleBack}
        isVisible={view === 'viewer'}
      />
    </div>
  );
}
