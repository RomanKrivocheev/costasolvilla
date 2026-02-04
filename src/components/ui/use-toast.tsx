'use client';

import * as React from 'react';

type Toast = {
  id: string;
  title?: string;
  description?: string;
};

type ToastState = {
  toasts: Toast[];
};

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

const ToastContext = React.createContext<{
  state: ToastState;
  dispatch: React.Dispatch<ToastAction>;
} | null>(null);

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD':
      return { toasts: [...state.toasts, action.toast] };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });
  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastState = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastState must be used within ToastProvider');
  }
  return ctx.state;
};

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  const { dispatch } = ctx;
  const toast = (data: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', toast: { id, ...data } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 3000);
  };
  return { toast };
};
