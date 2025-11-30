import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import BasePersonPanel from './components/BasePersonPanel';
import ClothingItemsPanel from './components/ClothingItemsPanel';
import GeneratedLookPanel from './components/GeneratedLookPanel';
import ChatBot from './components/ChatBot';
import ImageEditorModal from './components/ImageEditorModal';
import { ClothingItem, GenerationState } from './types';
import { generateTryOnLook } from './services/geminiService';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleBaseImageUpload = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setBaseImage(base64);
      // Reset generated image if base changes
      setGeneratedImage(null);
      setGenerationState({ status: 'idle' });
    } catch (err) {
      console.error("Error reading file", err);
    }
  }, []);

  const handleAddClothingItems = useCallback(async (files: FileList) => {
    const newItems: ClothingItem[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await fileToBase64(files[i]);
        newItems.push({ id: uuidv4(), data: base64 });
      } catch (err) {
        console.error("Error reading clothing file", err);
      }
    }
    setClothingItems(prev => [...prev, ...newItems]);
  }, []);

  const handleRemoveClothingItem = useCallback((id: string) => {
    setClothingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleGenerateLook = async () => {
    if (!baseImage || clothingItems.length === 0) return;

    setGenerationState({ status: 'processing' });
    try {
      const result = await generateTryOnLook(
        baseImage, 
        clothingItems.map(item => item.data)
      );
      setGeneratedImage(result);
      setGenerationState({ status: 'done' });
    } catch (error: any) {
      setGenerationState({ 
        status: 'error', 
        error: error.message || "Failed to generate look." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
          
          {/* Left Panel */}
          <div className="h-full">
            <BasePersonPanel 
              image={baseImage} 
              onImageUpload={handleBaseImageUpload}
              onRemove={() => { setBaseImage(null); setGeneratedImage(null); }}
            />
          </div>

          {/* Middle Panel */}
          <div className="h-full">
            <ClothingItemsPanel 
              items={clothingItems}
              onAddItems={handleAddClothingItems}
              onRemoveItem={handleRemoveClothingItem}
            />
          </div>

          {/* Right Panel */}
          <div className="h-full">
            <GeneratedLookPanel 
              resultImage={generatedImage}
              generationState={generationState}
              onGenerate={handleGenerateLook}
              onEdit={() => setIsEditorOpen(true)}
              canGenerate={!!baseImage && clothingItems.length > 0}
            />
          </div>
        </div>
      </main>
      
      {/* Progress / Status Bar (Optional implementation) */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
         <div 
           className="h-full bg-green-500 transition-all duration-500 ease-out"
           style={{ 
             width: generationState.status === 'processing' ? '70%' : 
                    generationState.status === 'done' ? '100%' : '0%',
             opacity: generationState.status === 'idle' ? 0 : 1 
            }}
         />
      </div>

      <ChatBot />

      {generatedImage && (
        <ImageEditorModal 
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          image={generatedImage}
          onImageUpdate={(newImg) => setGeneratedImage(newImg)}
        />
      )}
    </div>
  );
};

export default App;
