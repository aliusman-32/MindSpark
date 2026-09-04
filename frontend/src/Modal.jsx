import React, { createContext, useCallback, useContext, useState } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);

  const alertFn = useCallback((message) => {
    return new Promise((resolve) => {
      setModalState({ type: 'alert', message, resolve });
    });
  }, []);

  const promptFn = useCallback((message, defaultValue = '') => {
    return new Promise((resolve) => {
      setModalState({ type: 'prompt', message, inputValue: defaultValue ?? '', resolve });
    });
  }, []);

  const close = (value) => {
    setModalState((current) => {
      current?.resolve(value);
      return null;
    });
  };

  return (
    <ModalContext.Provider value={{ alert: alertFn, prompt: promptFn }}>
      {children}
      {modalState && (
        <ModalDialog
          state={modalState}
          onChange={(value) => setModalState((s) => ({ ...s, inputValue: value }))}
          onConfirm={() => close(modalState.type === 'prompt' ? modalState.inputValue : true)}
          onCancel={() => close(modalState.type === 'prompt' ? null : true)}
        />
      )}
    </ModalContext.Provider>
  );
}

function ModalDialog({ state, onChange, onConfirm, onCancel }) {
  const isPrompt = state.type === 'prompt';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 animate-modal-pop">
        <p className="text-gray-800 font-semibold text-center whitespace-pre-line">{state.message}</p>

        {isPrompt && (
          <input
            autoFocus
            type="text"
            value={state.inputValue}
            onChange={(e) => onChange(e.target.value)}
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        )}

        <div className="mt-6 flex gap-3">
          {isPrompt && (
            <button
              onClick={onCancel}
              className="flex-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            autoFocus={!isPrompt}
            onClick={onConfirm}
            className="flex-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}
