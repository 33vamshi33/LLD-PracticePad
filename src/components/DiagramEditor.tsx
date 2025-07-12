import React, { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

type ExcalidrawElement = ReturnType<ExcalidrawImperativeAPI['getSceneElements']>;

interface DiagramEditorProps {
  onSubmit: (diagram_json: any) => void;
}

const DiagramEditor: React.FC<DiagramEditorProps> = ({ onSubmit }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  const handleSubmit = () => {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      onSubmit(elements);
    }
  };

  return (
    <div className="w-full h-full relative">
      <style dangerouslySetInnerHTML={{
        __html: `
          .excalidraw-container {
            height: 100% !important;
            width: 100% !important;
          }
          .excalidraw-container .excalidraw {
            height: 100% !important;
            width: 100% !important;
          }
          .excalidraw-container .excalidraw .App {
            height: 100% !important;
            width: 100% !important;
          }
          .excalidraw-container .excalidraw .App .App-menu {
            display: none !important;
          }
          .excalidraw-container .excalidraw .App .App-toolbar {
            transform: scale(0.7) !important;
            transform-origin: top left !important;
          }
          .excalidraw-container .excalidraw .App .App-toolbar .ToolIcon {
            width: 28px !important;
            height: 28px !important;
          }
          .excalidraw-container .excalidraw .App .App-toolbar .ToolIcon__icon {
            width: 16px !important;
            height: 16px !important;
          }
          .excalidraw-container .excalidraw .App .App-toolbar .ToolIcon__label {
            font-size: 10px !important;
          }
          .excalidraw-container .excalidraw .App .App-toolbar .ToolIcon__keybinding {
            font-size: 8px !important;
          }
        `
      }} />
      <div className="excalidraw-container">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme="light"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              saveAsImage: false,
              toggleTheme: false,
            },
            dockedSidebarBreakpoint: 0,
            welcomeScreen: false,
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        className="absolute bottom-4 right-4 py-2.5 px-6 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 z-10 font-semibold transition-all duration-200 hover:shadow-xl"
      >
        Submit Design
      </button>
    </div>
  );
};

export default DiagramEditor;