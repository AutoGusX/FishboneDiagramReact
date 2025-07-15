import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

const FishboneContext = createContext();

// Default template categories
const defaultCategories = [
  { id: uuidv4(), name: 'People', x: 200, y: 100, spineX: 250, causes: [] },
  { id: uuidv4(), name: 'Process', x: 400, y: 100, spineX: 350, causes: [] },
  { id: uuidv4(), name: 'Materials', x: 600, y: 100, spineX: 450, causes: [] },
  { id: uuidv4(), name: 'Machines', x: 200, y: 400, spineX: 550, causes: [] },
  { id: uuidv4(), name: 'Measurements', x: 400, y: 400, spineX: 650, causes: [] },
  { id: uuidv4(), name: 'Environment', x: 600, y: 400, spineX: 750, causes: [] },
];

const initialState = {
  problemStatement: 'Problem Statement',
  categories: [],
  selectedNode: null,
  dragMode: false,
};

function fishboneReducer(state, action) {
  switch (action.type) {
    case 'SET_PROBLEM_STATEMENT':
      return { ...state, problemStatement: action.payload };
    
    case 'CLEAR_DIAGRAM':
      return { ...initialState };
    
    case 'LOAD_TEMPLATE':
      return { ...state, categories: defaultCategories };
    
    case 'ADD_CATEGORY':
      const newCategory = {
        id: uuidv4(),
        name: 'New Category',
        x: 300 + Math.random() * 200,
        y: 200 + Math.random() * 200,
        spineX: 300 + (state.categories.length * 100),
        causes: [],
      };
      return { ...state, categories: [...state.categories, newCategory] };
    
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, ...action.payload.updates } : cat
        ),
      };
    
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload),
      };
    
    case 'ADD_CAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? {
                ...cat,
                causes: [
                  ...cat.causes,
                  {
                    id: uuidv4(),
                    name: 'New Cause',
                    x: cat.x + (Math.random() - 0.5) * 100,
                    y: cat.y + (Math.random() - 0.5) * 100,
                    comment: '',
                    subcauses: [],
                  },
                ],
              }
            : cat
        ),
      };
    
    case 'UPDATE_CAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? {
                ...cat,
                causes: cat.causes.map(cause =>
                  cause.id === action.payload.causeId
                    ? { ...cause, ...action.payload.updates }
                    : cause
                ),
              }
            : cat
        ),
      };
    
    case 'DELETE_CAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? { ...cat, causes: cat.causes.filter(cause => cause.id !== action.payload.causeId) }
            : cat
        ),
      };
    
    case 'ADD_SUBCAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? {
                ...cat,
                causes: cat.causes.map(cause =>
                  cause.id === action.payload.causeId
                    ? {
                        ...cause,
                        subcauses: [
                          ...cause.subcauses,
                          {
                            id: uuidv4(),
                            name: 'New Subcause',
                            x: cause.x + (Math.random() - 0.5) * 60,
                            y: cause.y + (Math.random() - 0.5) * 60,
                            comment: '',
                          },
                        ],
                      }
                    : cause
                ),
              }
            : cat
        ),
      };
    
    case 'UPDATE_SUBCAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? {
                ...cat,
                causes: cat.causes.map(cause =>
                  cause.id === action.payload.causeId
                    ? {
                        ...cause,
                        subcauses: cause.subcauses.map(subcause =>
                          subcause.id === action.payload.subcauseId
                            ? { ...subcause, ...action.payload.updates }
                            : subcause
                        ),
                      }
                    : cause
                ),
              }
            : cat
        ),
      };
    
    case 'DELETE_SUBCAUSE':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.categoryId
            ? {
                ...cat,
                causes: cat.causes.map(cause =>
                  cause.id === action.payload.causeId
                    ? {
                        ...cause,
                        subcauses: cause.subcauses.filter(
                          subcause => subcause.id !== action.payload.subcauseId
                        ),
                      }
                    : cause
                ),
              }
            : cat
        ),
      };
    
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    
    case 'SET_DRAG_MODE':
      return { ...state, dragMode: action.payload };
    
    case 'LOAD_FROM_DATA':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

export function FishboneProvider({ children }) {
  const [state, dispatch] = useReducer(fishboneReducer, initialState);

  return (
    <FishboneContext.Provider value={{ state, dispatch }}>
      {children}
    </FishboneContext.Provider>
  );
}

export function useFishboneData() {
  const context = useContext(FishboneContext);
  if (!context) {
    throw new Error('useFishboneData must be used within a FishboneProvider');
  }
  return context;
} 