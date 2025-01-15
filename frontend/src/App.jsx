import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, Plus, Edit2, X, Check, Barcode, Trash2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './components/ui/Alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/Dialog';

const App = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [barcode, setBarcode] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddPetDialog, setShowAddPetDialog] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetType, setNewPetType] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);

  // Initialize state from localStorage with fallback values
  const [profileName, setProfileName] = useState(() => {
    const savedName = localStorage.getItem('profileName');
    return savedName || 'Sylvie';
  });

  const [tempName, setTempName] = useState(() => {
    const savedName = localStorage.getItem('profileName');
    return savedName || 'Sylvie';
  });

  const [pets, setPets] = useState(() => {
    const savedPets = localStorage.getItem('pets');
    return savedPets ? JSON.parse(savedPets) : [
      { id: 1, name: 'Fripouille', type: 'chien' },
      { id: 2, name: 'Pu-Yi', type: 'chat' }
    ];
  });

  const fileInputRef = useRef();
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage whenever profileName changes
  useEffect(() => {
    localStorage.setItem('profileName', profileName);
  }, [profileName]);

  // Save to localStorage whenever pets array changes
  useEffect(() => {
    localStorage.setItem('pets', JSON.stringify(pets));
  }, [pets]);

  // Save selected pet to localStorage
  useEffect(() => {
    if (selectedPet) {
      localStorage.setItem('selectedPet', JSON.stringify(selectedPet));
    } else {
      localStorage.removeItem('selectedPet');
    }
  }, [selectedPet]);

  // Restore selected pet on initial load
  useEffect(() => {
    const savedSelectedPet = localStorage.getItem('selectedPet');
    if (savedSelectedPet) {
      const parsedPet = JSON.parse(savedSelectedPet);
      // Verify the pet still exists in the pets array
      if (pets.some(pet => pet.id === parsedPet.id)) {
        setSelectedPet(parsedPet);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleNameSave = () => {
    setProfileName(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(profileName);
    setIsEditingName(false);
  };

  const handleAddPet = () => {
    if (newPetName && newPetType) {
      const newPet = {
        id: Date.now(), // Use timestamp as ID for better uniqueness
        name: newPetName,
        type: newPetType
      };
      setPets([...pets, newPet]);
      setNewPetName('');
      setNewPetType('');
      setShowAddPetDialog(false);
    }
  };

  const handleDeletePet = (petId, e) => {
    e.stopPropagation();
    if (selectedPet?.id === petId) {
      setSelectedPet(null);
    }
    setPets(pets.filter(pet => pet.id !== petId));
  };

  // Rest of your code remains the same...
  const getAnimalEmoji = (type) => {
    switch (type.toLowerCase()) {
      case 'chien': return '🐕';
      case 'chat': return '🐱';
      case 'lapin': return '🐰';
      default: return '🐾';
    }
  };

  const checkBarcode = async () => {
    if (!selectedPet) {
      setError('Veuillez sélectionner un animal');
      return;
    }
    if (!barcode) {
      setError('Veuillez entrer un code-barres');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/check-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, animal: selectedPet.type }),
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (e) => {
    if (!selectedPet) {
      setError('Veuillez sélectionner un animal');
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('animal', selectedPet.type);

    try {
      const response = await fetch('http://localhost:5000/api/scan-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setBarcode(data.barcode);
        setResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-orange-50">
      {/* Top Navigation */}
      <div className="fixed top-0 w-full bg-orange-400 text-white p-3 flex justify-between items-center">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 p-2 rounded-lg ${activeTab === 'search' ? 'bg-orange-500' : ''}`}
        >
          <Search size={24} className="mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 p-2 rounded-lg ${activeTab === 'camera' ? 'bg-orange-500' : ''}`}
        >
          <Camera size={24} className="mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`flex-1 p-2 rounded-lg ${activeTab === 'pets' ? 'bg-orange-500' : ''}`}
        >
          <img src="/api/placeholder/24/24" alt="Pet" className="w-6 h-6 mx-auto rounded-full" />
        </button>
      </div>

      {/* Selected Pet Indicator */}
      {selectedPet && (
        <div className="fixed top-16 w-full bg-orange-100 p-2 text-center text-orange-800">
          Animal sélectionné: {selectedPet.name} {getAnimalEmoji(selectedPet.type)}
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-16 ${selectedPet ? 'mt-8' : ''} p-4`}>
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Code-barres du produit"
                className="w-full p-3 pl-10 bg-white rounded-xl border-2 border-orange-200"
              />
              <Barcode className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <button
                onClick={checkBarcode}
                disabled={!selectedPet || !barcode || isLoading}
                className="absolute right-2 top-2 p-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 disabled:bg-gray-300"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedPet}
              className="w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-orange-300 flex items-center justify-center disabled:opacity-50"
            >
              <Camera size={48} className="text-orange-400" />
            </button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Pets Tab */}
        {activeTab === 'pets' && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-xl flex items-center space-x-3">
              <img src="/api/placeholder/48/48" alt="Profile" className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-2 py-1 rounded border border-orange-300 flex-1"
                    />
                    <button onClick={handleNameSave} className="text-green-600">
                      <Check size={20} />
                    </button>
                    <button onClick={handleNameCancel} className="text-red-600">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{profileName}</h3>
                    <button onClick={() => setIsEditingName(true)} className="text-orange-600">
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <span className="text-xl">👑</span>
            </div>

            {pets.map((pet) => (
              <div
                key={pet.id}
                className={`w-full bg-white p-4 rounded-xl flex items-center space-x-3 border-2
                  ${selectedPet?.id === pet.id ? 'border-orange-400' : 'border-transparent'}`}
              >
                <button
                  onClick={() => setSelectedPet(pet)}
                  className="flex-1 flex items-center space-x-3"
                >
                  <span className="text-2xl">{getAnimalEmoji(pet.type)}</span>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{pet.name}</h3>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDeletePet(pet.id, e)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddPetDialog(true)}
              className="w-full p-4 rounded-xl bg-orange-400 text-white flex items-center justify-center space-x-2"
            >
              <Plus size={24} />
              <span>Ajouter un animal</span>
            </button>
          </div>
        )}

        {/* Add Pet Dialog */}
        <Dialog open={showAddPetDialog} onOpenChange={setShowAddPetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un animal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'animal</label>
                <select
                  value={newPetType}
                  onChange={(e) => setNewPetType(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="chien">Chien</option>
                  <option value="chat">Chat</option>
                  <option value="lapin">Lapin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="Nom de l'animal"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddPetDialog(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPet}
                  disabled={!newPetName || !newPetType}
                  className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 disabled:bg-gray-300"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Messages */}
        {isLoading && (
          <div className="text-center text-orange-600 animate-pulse mt-4">
            Chargement...
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4 border-2 border-red-200 bg-red-50">
            <AlertTitle className="text-red-700">Erreur</AlertTitle>
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className={`mt-4 border-2 ${result.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertTitle className={result.includes('✅') ? 'text-green-700' : 'text-red-700'}>
              Résultat
            </AlertTitle>
            <AlertDescription className={`whitespace-pre-line ${result.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {result}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default App;