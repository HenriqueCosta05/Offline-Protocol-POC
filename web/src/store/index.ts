import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { bridgeApi } from '@/services/api';
import composer from './slices/composer';
import connection from './slices/connection';
import conversations from './slices/conversations';
import peers from './slices/peers';

const rootReducer = combineReducers({
  peers,
  conversations,
  connection,
  composer,
  [bridgeApi.reducerPath]: bridgeApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(bridgeApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
